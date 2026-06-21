using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MeetingRoomBooking.Api.Configuration;
using MeetingRoomBooking.Api.Data;
using MeetingRoomBooking.Api.DTOs;
using MeetingRoomBooking.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace MeetingRoomBooking.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly JwtSettings _jwt;
    private readonly SeedSettings _seed;
    private readonly INotificationService _notifications;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext db,
        IOptions<JwtSettings> jwt,
        IOptions<SeedSettings> seed,
        INotificationService notifications,
        ILogger<AuthService> logger)
    {
        _db = db;
        _jwt = jwt.Value;
        _seed = seed.Value;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (!IsAllowedEmail(email))
            throw new InvalidOperationException("Регистрация доступна только для почты вуза (@edu.ru, @mirea.ru).");

        if (await _db.BlockedEmails.AnyAsync(b => b.Email == email))
            throw new InvalidOperationException("Этот email заблокирован. Регистрация невозможна.");

        if (await _db.Users.AnyAsync(u => u.Email == email))
            throw new InvalidOperationException("Пользователь с таким email уже существует.");

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName.Trim(),
            Role = UserRole.User,
            Status = UserStatus.Pending,
            RegisteredAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _notifications.CreateAsync(
            user.Id,
            "Система",
            "Регистрация",
            "Заявка на регистрацию отправлена. Ожидайте подтверждения от администратора.");

        _logger.LogInformation("User registered: {Email}", email);

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Неверный email или пароль.");

        if (user.Status == UserStatus.Blocked)
            throw new UnauthorizedAccessException("Аккаунт заблокирован.");

        _logger.LogInformation("User logged in: {Email}", email);
        return CreateAuthResponse(user);
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("status", user.Status.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.ExpireMinutes),
            signingCredentials: creds);

        return new AuthResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role.ToString(),
            user.Status.ToString());
    }

    private bool IsAllowedEmail(string email)
    {
        var at = email.LastIndexOf('@');
        if (at < 0) return false;
        var domain = email[(at + 1)..];
        return _seed.AllowedEmailDomains.Any(d => domain.Equals(d, StringComparison.OrdinalIgnoreCase));
    }
}

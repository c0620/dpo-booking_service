using MeetingRoomBooking.Api.Data;
using MeetingRoomBooking.Api.DTOs;
using MeetingRoomBooking.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetingRoomBooking.Api.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;
    private readonly ILogger<UserService> _logger;

    public UserService(AppDbContext db, INotificationService notifications, ILogger<UserService> logger)
    {
        _db = db;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<ProfileDto> GetProfileAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Пользователь не найден.");
        return MapProfile(user);
    }

    public async Task<ProfileDto> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Пользователь не найден.");

        user.DisplayName = request.DisplayName.Trim();

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (request.NewPassword.Length < 5)
                throw new ArgumentException("Пароль должен содержать не менее 5 символов.");
            if (request.NewPassword != request.ConfirmPassword)
                throw new ArgumentException("Пароли не совпадают.");
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Profile updated for user {UserId}", userId);
        return MapProfile(user);
    }

    public async Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(int userId)
    {
        var items = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return items.Select(n => new NotificationDto(
            n.Id,
            n.Sender,
            n.Title,
            n.Body,
            n.CreatedAt.ToString("yyyy-MM-dd"))).ToList();
    }

    public async Task<IReadOnlyList<AdminUserDto>> GetUsersAsync(string? sort, string? status)
    {
        var query = _db.Users.Where(u => u.Role == UserRole.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<UserStatus>(status, true, out var statusFilter))
        {
            query = query.Where(u => u.Status == statusFilter);
        }
        else
        {
            query = query.Where(u => u.Status != UserStatus.Blocked);
        }

        query = sort?.ToLowerInvariant() switch
        {
            "date" => query.OrderByDescending(u => u.RegisteredAt),
            "status" => query.OrderBy(u => u.Status).ThenBy(u => u.Email),
            _ => query.OrderBy(u => u.Email)
        };

        var users = await query.ToListAsync();
        return users.Select(u => new AdminUserDto(
            u.Id,
            u.Email,
            u.DisplayName,
            u.Status.ToString(),
            u.RegisteredAt.ToString("yyyy-MM-dd"))).ToList();
    }

    public async Task ApproveUserAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Пользователь не найден.");

        if (user.Role == UserRole.Admin)
            throw new InvalidOperationException("Нельзя изменить статус администратора.");

        user.Status = UserStatus.Approved;
        await _db.SaveChangesAsync();

        await _notifications.CreateAsync(
            user.Id,
            "Admin",
            "Подтверждение профиля",
            "Профиль подтверждён. Теперь вам доступны полные функции системы.");

        _logger.LogInformation("User {UserId} approved", userId);
    }

    public async Task DeleteUserAsync(int userId)
    {
        var user = await _db.Users
            .Include(u => u.Bookings)
            .Include(u => u.Notifications)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("Пользователь не найден.");

        if (user.Role == UserRole.Admin)
            throw new InvalidOperationException("Нельзя удалить администратора.");

        _db.Bookings.RemoveRange(user.Bookings);
        _db.Notifications.RemoveRange(user.Notifications);
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {UserId} deleted", userId);
    }

    public async Task BlockUserAsync(int userId)
    {
        var user = await _db.Users
            .Include(u => u.Bookings)
            .ThenInclude(b => b.Room)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("Пользователь не найден.");

        if (user.Role == UserRole.Admin)
            throw new InvalidOperationException("Нельзя заблокировать администратора.");

        if (user.Status == UserStatus.Blocked)
            throw new InvalidOperationException("Пользователь уже заблокирован.");

        var email = user.Email;

        user.StatusBeforeBlock = user.Status;
        user.Status = UserStatus.Blocked;

        if (!await _db.BlockedEmails.AnyAsync(b => b.Email == email))
        {
            _db.BlockedEmails.Add(new BlockedEmail
            {
                Email = email,
                BlockedAt = DateTime.UtcNow
            });
        }

        foreach (var booking in user.Bookings.Where(b => b.Status == BookingStatus.Active))
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancelReason = "Аккаунт пользователя заблокирован";

            var timeLabel = $"{FormatMinutes(booking.StartMinutes)}–{FormatMinutes(booking.EndMinutes)}";
            await _notifications.CreateAsync(
                user.Id,
                "Admin",
                "Отмена бронирования",
                $"Бронирование «{booking.Room.Name} на {booking.Date:dd MMMM yyyy} {timeLabel}» отменено в связи с блокировкой аккаунта.");
        }

        await _notifications.CreateAsync(
            user.Id,
            "Admin",
            "Блокировка аккаунта",
            "Ваш аккаунт заблокирован администратором.");

        await _db.SaveChangesAsync();

        _logger.LogInformation("User {UserId} blocked, email {Email}", userId, email);
    }

    public async Task UnblockUserAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Пользователь не найден.");

        if (user.Role == UserRole.Admin)
            throw new InvalidOperationException("Нельзя разблокировать администратора.");

        if (user.Status != UserStatus.Blocked)
            throw new InvalidOperationException("Пользователь не заблокирован.");

        user.Status = user.StatusBeforeBlock ?? UserStatus.Approved;
        user.StatusBeforeBlock = null;

        var blockedEmail = await _db.BlockedEmails.FirstOrDefaultAsync(b => b.Email == user.Email);
        if (blockedEmail is not null)
            _db.BlockedEmails.Remove(blockedEmail);

        await _notifications.CreateAsync(
            user.Id,
            "Admin",
            "Разблокировка аккаунта",
            "Ваш аккаунт разблокирован. Доступ к системе восстановлен.");

        await _db.SaveChangesAsync();

        _logger.LogInformation("User {UserId} unblocked", userId);
    }

    private static string FormatMinutes(int minutes) =>
        $"{minutes / 60:D2}:{minutes % 60:D2}";

    private static ProfileDto MapProfile(User user) => new(
        user.Id,
        user.Email,
        user.DisplayName,
        user.Role.ToString(),
        user.Status.ToString());
}

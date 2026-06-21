using MeetingRoomBooking.Api.DTOs;
using MeetingRoomBooking.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MeetingRoomBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Registration failed for {Email}", request.Email);
            return BadRequest(new ProblemDetails { Title = ex.Message, Status = StatusCodes.Status400BadRequest });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Login failed for {Email}", request.Email);
            return Unauthorized(new ProblemDetails { Title = ex.Message, Status = StatusCodes.Status401Unauthorized });
        }
    }
}

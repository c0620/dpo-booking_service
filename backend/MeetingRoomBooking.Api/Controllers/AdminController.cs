using System.Security.Claims;
using MeetingRoomBooking.Api.DTOs;
using MeetingRoomBooking.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MeetingRoomBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IBookingService _bookingService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IUserService userService, IBookingService bookingService, ILogger<AdminController> logger)
    {
        _userService = userService;
        _bookingService = bookingService;
        _logger = logger;
    }

    private int GetAdminId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? sort, [FromQuery] string? status)
    {
        var users = await _userService.GetUsersAsync(sort, status);
        return Ok(users);
    }

    [HttpPost("users/{id:int}/approve")]
    public async Task<IActionResult> ApproveUser(int id)
    {
        try
        {
            await _userService.ApproveUserAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails { Title = ex.Message, Status = 404 });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails { Title = ex.Message, Status = 400 });
        }
    }

    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            await _userService.DeleteUserAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails { Title = ex.Message, Status = 404 });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails { Title = ex.Message, Status = 400 });
        }
    }

    [HttpPost("users/{id:int}/block")]
    public async Task<IActionResult> BlockUser(int id)
    {
        try
        {
            await _userService.BlockUserAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails { Title = ex.Message, Status = 404 });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails { Title = ex.Message, Status = 400 });
        }
    }

    [HttpPost("users/{id:int}/unblock")]
    public async Task<IActionResult> UnblockUser(int id)
    {
        try
        {
            await _userService.UnblockUserAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails { Title = ex.Message, Status = 404 });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails { Title = ex.Message, Status = 400 });
        }
    }

    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookings(
        [FromQuery] int? roomId,
        [FromQuery] string? sort,
        [FromQuery] string? from,
        [FromQuery] string? to)
    {
        DateOnly? fromDate = DateOnly.TryParse(from, out var f) ? f : null;
        DateOnly? toDate = DateOnly.TryParse(to, out var t) ? t : null;

        var bookings = await _bookingService.GetAdminBookingsAsync(roomId, sort, fromDate, toDate);
        return Ok(bookings);
    }

    [HttpDelete("bookings/{id:int}")]
    public async Task<IActionResult> CancelBooking(int id, [FromBody] CancelBookingRequest? request)
    {
        try
        {
            await _bookingService.CancelByAdminAsync(GetAdminId(), id, request?.Reason);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Admin cancel booking failed");
            return NotFound(new ProblemDetails { Title = ex.Message, Status = 404 });
        }
    }
}

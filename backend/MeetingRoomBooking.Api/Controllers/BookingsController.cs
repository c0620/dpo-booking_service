using System.Security.Claims;
using MeetingRoomBooking.Api.DTOs;
using MeetingRoomBooking.Api.Models;
using MeetingRoomBooking.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MeetingRoomBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(IBookingService bookingService, ILogger<BookingsController> logger)
    {
        _bookingService = bookingService;
        _logger = logger;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool IsApproved() => User.FindFirstValue("status") == UserStatus.Approved.ToString();

    [HttpGet("my")]
    public async Task<IActionResult> GetMy()
    {
        var bookings = await _bookingService.GetMyBookingsAsync(GetUserId());
        return Ok(bookings);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (!IsApproved())
            return Forbid();

        try
        {
            var booking = await _bookingService.CreateAsync(GetUserId(), request);
            return Ok(booking);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails { Title = ex.Message, Status = 400 });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ProblemDetails { Title = ex.Message, Status = 400 });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails { Title = ex.Message, Status = 404 });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        try
        {
            await _bookingService.CancelByUserAsync(GetUserId(), id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cancel booking failed");
            return NotFound(new ProblemDetails { Title = ex.Message, Status = 404 });
        }
    }
}

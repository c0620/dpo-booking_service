using System.Security.Claims;
using MeetingRoomBooking.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MeetingRoomBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var rooms = await _roomService.GetAllAsync();
        return Ok(rooms);
    }

    [HttpGet("{id:int}/availability")]
    [Authorize]
    public async Task<IActionResult> GetAvailability(int id, [FromQuery] string date)
    {
        if (!DateOnly.TryParse(date, out var parsedDate))
            return BadRequest(new ProblemDetails { Title = "Некорректная дата", Status = 400 });

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int? userId = int.TryParse(userIdClaim, out var uid) ? uid : null;

        try
        {
            var availability = await _roomService.GetAvailabilityAsync(id, parsedDate, userId);
            return Ok(availability);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails { Title = ex.Message, Status = 404 });
        }
    }
}

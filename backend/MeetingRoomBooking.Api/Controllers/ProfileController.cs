using System.Security.Claims;
using MeetingRoomBooking.Api.DTOs;
using MeetingRoomBooking.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MeetingRoomBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IUserService _userService;

    public ProfileController(IUserService userService)
    {
        _userService = userService;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            var profile = await _userService.GetProfileAsync(GetUserId());
            return Ok(profile);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails { Title = ex.Message, Status = 404 });
        }
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var profile = await _userService.UpdateProfileAsync(GetUserId(), request);
            return Ok(profile);
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

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications()
    {
        var notifications = await _userService.GetNotificationsAsync(GetUserId());
        return Ok(notifications);
    }
}

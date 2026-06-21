using System.ComponentModel.DataAnnotations;

namespace MeetingRoomBooking.Api.DTOs;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(5)] string Password,
    [Required, MinLength(1)] string DisplayName);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record AuthResponse(
    string Token,
    int UserId,
    string Email,
    string DisplayName,
    string Role,
    string Status);

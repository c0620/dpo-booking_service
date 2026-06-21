using System.ComponentModel.DataAnnotations;

namespace MeetingRoomBooking.Api.DTOs;

public record ProfileDto(
    int Id,
    string Email,
    string DisplayName,
    string Role,
    string Status);

public record UpdateProfileRequest(
    [Required, MinLength(1)] string DisplayName,
    string? NewPassword,
    string? ConfirmPassword);

public record NotificationDto(
    int Id,
    string Sender,
    string Title,
    string Body,
    string CreatedAt);

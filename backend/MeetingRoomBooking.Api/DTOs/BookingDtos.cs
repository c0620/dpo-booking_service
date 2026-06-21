using System.ComponentModel.DataAnnotations;

namespace MeetingRoomBooking.Api.DTOs;

public record CreateBookingRequest(
    [Required] int RoomId,
    [Required] string Date,
    [Required] int StartMinutes,
    [Required] int EndMinutes);

public record BookingDto(
    int Id,
    int RoomId,
    string RoomCode,
    string RoomName,
    int Floor,
    string Date,
    int StartMinutes,
    int EndMinutes,
    string Status,
    string UserEmail,
    string UserDisplayName);

public record CancelBookingRequest(string? Reason);

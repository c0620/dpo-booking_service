namespace MeetingRoomBooking.Api.DTOs;

public record AdminUserDto(
    int Id,
    string Email,
    string DisplayName,
    string Status,
    string RegisteredAt);

public record AdminBookingDto(
    int Id,
    int RoomId,
    string RoomName,
    string Date,
    int StartMinutes,
    int EndMinutes,
    string UserEmail,
    string UserDisplayName,
    string Status);

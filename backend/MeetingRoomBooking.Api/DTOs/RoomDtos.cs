namespace MeetingRoomBooking.Api.DTOs;

public record RoomDto(
    int Id,
    string Code,
    string Name,
    int Floor,
    int Capacity,
    string Description,
    string[] Amenities,
    string[] ImageUrls,
    int MapX,
    int MapY,
    int MapWidth,
    int MapHeight);

public record BookingSlotDto(
    int Id,
    int StartMinutes,
    int EndMinutes,
    string UserEmail,
    string UserDisplayName,
    bool IsOwn);

public record RoomAvailabilityDto(
    int RoomId,
    string Date,
    int WorkDayStartMinutes,
    int WorkDayEndMinutes,
    BookingSlotDto[] Slots);

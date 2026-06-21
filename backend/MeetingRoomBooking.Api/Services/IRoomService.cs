using MeetingRoomBooking.Api.DTOs;

namespace MeetingRoomBooking.Api.Services;

public interface IRoomService
{
    Task<IReadOnlyList<RoomDto>> GetAllAsync();
    Task<RoomAvailabilityDto> GetAvailabilityAsync(int roomId, DateOnly date, int? currentUserId);
}

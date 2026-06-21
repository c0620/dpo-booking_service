using MeetingRoomBooking.Api.DTOs;

namespace MeetingRoomBooking.Api.Services;

public interface IBookingService
{
    Task<IReadOnlyList<BookingDto>> GetMyBookingsAsync(int userId);
    Task<BookingDto> CreateAsync(int userId, CreateBookingRequest request);
    Task CancelByUserAsync(int userId, int bookingId);
    Task<IReadOnlyList<AdminBookingDto>> GetAdminBookingsAsync(int? roomId, string? sort, DateOnly? from, DateOnly? to);
    Task CancelByAdminAsync(int adminId, int bookingId, string? reason);
}

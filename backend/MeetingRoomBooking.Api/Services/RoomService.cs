using System.Text.Json;
using MeetingRoomBooking.Api.Configuration;
using MeetingRoomBooking.Api.Data;
using MeetingRoomBooking.Api.DTOs;
using MeetingRoomBooking.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MeetingRoomBooking.Api.Services;

public class RoomService : IRoomService
{
    private readonly AppDbContext _db;
    private readonly BookingSettings _booking;
    private readonly ILogger<RoomService> _logger;

    public RoomService(AppDbContext db, IOptions<BookingSettings> booking, ILogger<RoomService> logger)
    {
        _db = db;
        _booking = booking.Value;
        _logger = logger;
    }

    public async Task<IReadOnlyList<RoomDto>> GetAllAsync()
    {
        var rooms = await _db.Rooms.OrderBy(r => r.Floor).ThenBy(r => r.Code).ToListAsync();
        _logger.LogInformation("Loaded {Count} rooms", rooms.Count);
        return rooms.Select(MapRoom).ToList();
    }

    public async Task<RoomAvailabilityDto> GetAvailabilityAsync(int roomId, DateOnly date, int? currentUserId)
    {
        var room = await _db.Rooms.FindAsync(roomId)
            ?? throw new KeyNotFoundException("Комната не найдена.");

        var bookings = await _db.Bookings
            .Include(b => b.User)
            .Where(b => b.RoomId == roomId && b.Date == date && b.Status == BookingStatus.Active)
            .OrderBy(b => b.StartMinutes)
            .ToListAsync();

        var slots = bookings.Select(b => new BookingSlotDto(
            b.Id,
            b.StartMinutes,
            b.EndMinutes,
            b.User.Email,
            b.User.DisplayName,
            currentUserId.HasValue && b.UserId == currentUserId.Value)).ToArray();

        return new RoomAvailabilityDto(
            room.Id,
            date.ToString("yyyy-MM-dd"),
            _booking.WorkDayStartMinutes,
            _booking.WorkDayEndMinutes,
            slots);
    }

    internal static RoomDto MapRoom(Room room) => new(
        room.Id,
        room.Code,
        room.Name,
        room.Floor,
        room.Capacity,
        room.Description,
        JsonSerializer.Deserialize<string[]>(room.AmenitiesJson) ?? [],
        JsonSerializer.Deserialize<string[]>(room.ImageUrlsJson) ?? [],
        room.MapX,
        room.MapY,
        room.MapWidth,
        room.MapHeight);
}

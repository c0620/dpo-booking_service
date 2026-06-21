using MeetingRoomBooking.Api.Configuration;
using MeetingRoomBooking.Api.Data;
using MeetingRoomBooking.Api.DTOs;
using MeetingRoomBooking.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MeetingRoomBooking.Api.Services;

public class BookingService : IBookingService
{
    private readonly AppDbContext _db;
    private readonly BookingSettings _booking;
    private readonly INotificationService _notifications;
    private readonly ILogger<BookingService> _logger;

    public BookingService(
        AppDbContext db,
        IOptions<BookingSettings> booking,
        INotificationService notifications,
        ILogger<BookingService> logger)
    {
        _db = db;
        _booking = booking.Value;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<IReadOnlyList<BookingDto>> GetMyBookingsAsync(int userId)
    {
        var bookings = await _db.Bookings
            .Include(b => b.Room)
            .Include(b => b.User)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.Date)
            .ThenByDescending(b => b.StartMinutes)
            .ToListAsync();

        return bookings.Select(MapBooking).ToList();
    }

    public async Task<BookingDto> CreateAsync(int userId, CreateBookingRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Пользователь не найден.");

        if (user.Status != UserStatus.Approved)
            throw new InvalidOperationException("Бронирование доступно только после подтверждения профиля.");

        if (!DateOnly.TryParse(request.Date, out var date))
            throw new ArgumentException("Некорректная дата.");

        ValidateTimeRange(request.StartMinutes, request.EndMinutes);
        ValidateNotInPast(date, request.StartMinutes);

        var room = await _db.Rooms.FindAsync(request.RoomId)
            ?? throw new KeyNotFoundException("Комната не найдена.");

        if (await HasOverlapAsync(request.RoomId, date, request.StartMinutes, request.EndMinutes))
            throw new InvalidOperationException("Выбранное время уже занято.");

        var booking = new Booking
        {
            RoomId = request.RoomId,
            UserId = userId,
            Date = date,
            StartMinutes = request.StartMinutes,
            EndMinutes = request.EndMinutes,
            Status = BookingStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();

        await _db.Entry(booking).Reference(b => b.Room).LoadAsync();
        await _db.Entry(booking).Reference(b => b.User).LoadAsync();

        _logger.LogInformation("Booking created: {BookingId} for room {RoomId}", booking.Id, room.Id);
        return MapBooking(booking);
    }

    public async Task CancelByUserAsync(int userId, int bookingId)
    {
        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.UserId == userId && b.Status == BookingStatus.Active)
            ?? throw new KeyNotFoundException("Бронирование не найдено.");

        booking.Status = BookingStatus.Cancelled;
        await _db.SaveChangesAsync();
        _logger.LogInformation("Booking {BookingId} cancelled by user {UserId}", bookingId, userId);
    }

    public async Task<IReadOnlyList<AdminBookingDto>> GetAdminBookingsAsync(int? roomId, string? sort, DateOnly? from, DateOnly? to)
    {
        var query = _db.Bookings
            .Include(b => b.Room)
            .Include(b => b.User)
            .Where(b => b.Status == BookingStatus.Active && b.User.Status != UserStatus.Blocked)
            .AsQueryable();

        if (roomId.HasValue)
            query = query.Where(b => b.RoomId == roomId.Value);

        if (from.HasValue)
            query = query.Where(b => b.Date >= from.Value);

        if (to.HasValue)
            query = query.Where(b => b.Date <= to.Value);

        query = sort?.ToLowerInvariant() switch
        {
            "user" => query.OrderBy(b => b.User.Email).ThenBy(b => b.Date).ThenBy(b => b.StartMinutes),
            _ => query.OrderBy(b => b.Date).ThenBy(b => b.StartMinutes)
        };

        var bookings = await query.ToListAsync();
        return bookings.Select(b => new AdminBookingDto(
            b.Id,
            b.RoomId,
            b.Room.Name,
            b.Date.ToString("yyyy-MM-dd"),
            b.StartMinutes,
            b.EndMinutes,
            b.User.Email,
            b.User.DisplayName,
            b.Status.ToString())).ToList();
    }

    public async Task CancelByAdminAsync(int adminId, int bookingId, string? reason)
    {
        var booking = await _db.Bookings
            .Include(b => b.Room)
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.Status == BookingStatus.Active)
            ?? throw new KeyNotFoundException("Бронирование не найдено.");

        booking.Status = BookingStatus.Cancelled;
        booking.CancelReason = reason;
        booking.CancelledByAdminId = adminId;
        await _db.SaveChangesAsync();

        var timeLabel = $"{FormatMinutes(booking.StartMinutes)}–{FormatMinutes(booking.EndMinutes)}";
        var body = $"Бронирование «{booking.Room.Name} на {booking.Date:dd MMMM yyyy} {timeLabel}» отменено.";
        if (!string.IsNullOrWhiteSpace(reason))
            body += $" Причина: {reason}";

        await _notifications.CreateAsync(booking.UserId, "Admin", "Отмена бронирования", body);
        _logger.LogInformation("Booking {BookingId} cancelled by admin {AdminId}", bookingId, adminId);
    }

    private void ValidateTimeRange(int start, int end)
    {
        if (start >= end)
            throw new ArgumentException("Время окончания должно быть позже начала.");

        if (start < _booking.WorkDayStartMinutes || end > _booking.WorkDayEndMinutes)
            throw new ArgumentException($"Бронирование доступно с {_booking.WorkDayStart} до {_booking.WorkDayEnd}.");
    }

    private static void ValidateNotInPast(DateOnly date, int startMinutes)
    {
        var bookingStart = date.ToDateTime(new TimeOnly(startMinutes / 60, startMinutes % 60));
        if (bookingStart <= DateTime.Now)
            throw new ArgumentException("Нельзя бронировать на прошедшее время.");
    }

    private async Task<bool> HasOverlapAsync(int roomId, DateOnly date, int start, int end)
    {
        return await _db.Bookings.AnyAsync(b =>
            b.RoomId == roomId &&
            b.Date == date &&
            b.Status == BookingStatus.Active &&
            b.StartMinutes < end &&
            b.EndMinutes > start);
    }

    private static BookingDto MapBooking(Booking b) => new(
        b.Id,
        b.RoomId,
        b.Room.Code,
        b.Room.Name,
        b.Room.Floor,
        b.Date.ToString("yyyy-MM-dd"),
        b.StartMinutes,
        b.EndMinutes,
        b.Status.ToString(),
        b.User.Email,
        b.User.DisplayName);

    private static string FormatMinutes(int minutes) =>
        $"{minutes / 60:D2}:{minutes % 60:D2}";
}

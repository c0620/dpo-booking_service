using MeetingRoomBooking.Api.Data;
using MeetingRoomBooking.Api.Models;

namespace MeetingRoomBooking.Api.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AppDbContext db, ILogger<NotificationService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task CreateAsync(int userId, string sender, string title, string body)
    {
        var notification = new Notification
        {
            UserId = userId,
            Sender = sender,
            Title = title,
            Body = body,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Notification created for user {UserId}: {Title}", userId, title);
    }
}

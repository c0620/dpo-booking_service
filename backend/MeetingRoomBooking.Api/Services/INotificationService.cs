namespace MeetingRoomBooking.Api.Services;

public interface INotificationService
{
    Task CreateAsync(int userId, string sender, string title, string body);
}

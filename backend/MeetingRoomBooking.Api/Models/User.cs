namespace MeetingRoomBooking.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public UserStatus Status { get; set; } = UserStatus.Pending;
    public UserStatus? StatusBeforeBlock { get; set; }
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

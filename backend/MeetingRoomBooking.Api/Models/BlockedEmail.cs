namespace MeetingRoomBooking.Api.Models;

public class BlockedEmail
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public DateTime BlockedAt { get; set; } = DateTime.UtcNow;
}

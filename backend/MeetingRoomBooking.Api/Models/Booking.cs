namespace MeetingRoomBooking.Api.Models;

public class Booking
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateOnly Date { get; set; }
    public int StartMinutes { get; set; }
    public int EndMinutes { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Active;
    public string? CancelReason { get; set; }
    public int? CancelledByAdminId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

namespace MeetingRoomBooking.Api.Models;

public class Room
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Floor { get; set; }
    public int Capacity { get; set; }
    public string Description { get; set; } = string.Empty;
    public string AmenitiesJson { get; set; } = "[]";
    public string ImageUrlsJson { get; set; } = "[]";
    public int MapX { get; set; }
    public int MapY { get; set; }
    public int MapWidth { get; set; }
    public int MapHeight { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}

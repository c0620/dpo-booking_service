namespace MeetingRoomBooking.Api.Configuration;

public class SeedSettings
{
    public string AdminEmail { get; set; } = "admin@edu.ru";
    public string AdminPassword { get; set; } = "admin123";
    public string[] AllowedEmailDomains { get; set; } = ["edu.ru", "mirea.ru"];
}

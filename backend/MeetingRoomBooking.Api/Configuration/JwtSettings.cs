namespace MeetingRoomBooking.Api.Configuration;

public class JwtSettings
{
    public string Issuer { get; set; } = "MeetingRoomBookingServer";
    public string Audience { get; set; } = "MeetingRoomBookingClient";
    public string Key { get; set; } = "mysupersecret_secretsecretsecretkey!123";
    public int ExpireMinutes { get; set; } = 120;
}

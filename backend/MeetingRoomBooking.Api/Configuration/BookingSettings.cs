namespace MeetingRoomBooking.Api.Configuration;

public class BookingSettings
{
    public string WorkDayStart { get; set; } = "09:00";
    public string WorkDayEnd { get; set; } = "18:00";
    public int SlotStepMinutes { get; set; } = 30;

    public int WorkDayStartMinutes => ParseTime(WorkDayStart);
    public int WorkDayEndMinutes => ParseTime(WorkDayEnd);

    private static int ParseTime(string time)
    {
        var parts = time.Split(':');
        return int.Parse(parts[0]) * 60 + int.Parse(parts[1]);
    }
}

using MeetingRoomBooking.Api.DTOs;

namespace MeetingRoomBooking.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
}

using MeetingRoomBooking.Api.DTOs;

namespace MeetingRoomBooking.Api.Services;

public interface IUserService
{
    Task<ProfileDto> GetProfileAsync(int userId);
    Task<ProfileDto> UpdateProfileAsync(int userId, UpdateProfileRequest request);
    Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(int userId);
    Task<IReadOnlyList<AdminUserDto>> GetUsersAsync(string? sort, string? status);
    Task ApproveUserAsync(int userId);
    Task DeleteUserAsync(int userId);
    Task BlockUserAsync(int userId);
    Task UnblockUserAsync(int userId);
}

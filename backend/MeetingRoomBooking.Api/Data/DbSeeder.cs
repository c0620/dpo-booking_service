using System.Text.Json;
using MeetingRoomBooking.Api.Configuration;
using MeetingRoomBooking.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MeetingRoomBooking.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var seed = scope.ServiceProvider.GetRequiredService<IOptions<SeedSettings>>().Value;
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        await db.Database.MigrateAsync();

        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Admin))
        {
            db.Users.Add(new User
            {
                Email = seed.AdminEmail.ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(seed.AdminPassword),
                DisplayName = "Администратор",
                Role = UserRole.Admin,
                Status = UserStatus.Approved,
                RegisteredAt = DateTime.UtcNow.AddDays(-30)
            });
            logger.LogInformation("Admin user seeded: {Email}", seed.AdminEmail);
        }

        if (!await db.Rooms.AnyAsync())
        {
            db.Rooms.AddRange(
                new Room
                {
                    Code = "П106",
                    Name = "Проектная комната",
                    Floor = 1,
                    Capacity = 40,
                    Description = "Вместимость до 40 человек, интерьер в фирменном стиле МИРЭА — идеально подходит для ответственных встреч в большой компании",
                    AmenitiesJson = JsonSerializer.Serialize(new[] { "проектор", "микрофон", "доска-трансформер", "лаборатория", "кондиционер" }),
                    ImageUrlsJson = JsonSerializer.Serialize(new[] { "/assets/rooms/room-106.jpg" }),
                    MapX = 547, MapY = 24, MapWidth = 122, MapHeight = 166
                },
                new Room
                {
                    Code = "П815",
                    Name = "Комната встреч",
                    Floor = 8,
                    Capacity = 12,
                    Description = "Уютная переговорная для небольших рабочих встреч и обсуждений проектов.",
                    AmenitiesJson = JsonSerializer.Serialize(new[] { "проектор", "доска", "кондиционер" }),
                    ImageUrlsJson = JsonSerializer.Serialize(new[] { "/assets/rooms/room-815.jpg" }),
                    MapX = 28, MapY = 132, MapWidth = 114, MapHeight = 58
                },
                new Room
                {
                    Code = "П807",
                    Name = "Конференц-зал",
                    Floor = 8,
                    Capacity = 25,
                    Description = "Просторный конференц-зал для презентаций и совещаний среднего масштаба.",
                    AmenitiesJson = JsonSerializer.Serialize(new[] { "проектор", "микрофон", "кондиционер" }),
                    ImageUrlsJson = JsonSerializer.Serialize(new[] { "/assets/rooms/room-807.jpg" }),
                    MapX = 616, MapY = 24, MapWidth = 53, MapHeight = 166
                },
                new Room
                {
                    Code = "П610",
                    Name = "Компьютерная практика",
                    Floor = 6,
                    Capacity = 30,
                    Description = "Компьютерный класс с рабочими местами для практических занятий и командной работы.",
                    AmenitiesJson = JsonSerializer.Serialize(new[] { "компьютеры", "проектор", "кондиционер" }),
                    ImageUrlsJson = JsonSerializer.Serialize(new[] { "/assets/rooms/room-610.jpg" }),
                    MapX = 220, MapY = 132, MapWidth = 265, MapHeight = 58
                });
            logger.LogInformation("Rooms seeded");
        }
        else
        {
            var imageByCode = new Dictionary<string, string>
            {
                ["П106"] = "/assets/rooms/room-106.jpg",
                ["П815"] = "/assets/rooms/room-815.jpg",
                ["П807"] = "/assets/rooms/room-807.jpg",
                ["П610"] = "/assets/rooms/room-610.jpg",
            };

            foreach (var room in await db.Rooms.ToListAsync())
            {
                if (!imageByCode.TryGetValue(room.Code, out var imagePath)) continue;
                var expected = JsonSerializer.Serialize(new[] { imagePath });
                if (room.ImageUrlsJson != expected)
                {
                    room.ImageUrlsJson = expected;
                    logger.LogInformation("Updated image for room {Code}", room.Code);
                }
            }
        }

        if (!await db.Users.AnyAsync(u => u.Email == "student@edu.ru"))
        {
            var pendingUser = new User
            {
                Email = "student@edu.ru",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("student"),
                DisplayName = "Иван Студентов",
                Role = UserRole.User,
                Status = UserStatus.Pending,
                RegisteredAt = DateTime.UtcNow.AddDays(-2)
            };
            db.Users.Add(pendingUser);
            await db.SaveChangesAsync();

            db.Notifications.Add(new Notification
            {
                UserId = pendingUser.Id,
                Sender = "Система",
                Title = "Регистрация",
                Body = "Заявка на регистрацию отправлена. Ожидайте подтверждения от администратора.",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            });
        }

        if (!await db.Users.AnyAsync(u => u.Email == "user@edu.ru"))
        {
            var approvedUser = new User
            {
                Email = "user@edu.ru",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("user123"),
                DisplayName = "Пётр Пользователь",
                Role = UserRole.User,
                Status = UserStatus.Approved,
                RegisteredAt = DateTime.UtcNow.AddDays(-10)
            };
            db.Users.Add(approvedUser);
            await db.SaveChangesAsync();

            var room106 = await db.Rooms.FirstAsync(r => r.Code == "П106");
            var room807 = await db.Rooms.FirstAsync(r => r.Code == "П807");
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            db.Bookings.AddRange(
                new Booking
                {
                    RoomId = room106.Id,
                    UserId = approvedUser.Id,
                    Date = today,
                    StartMinutes = 9 * 60,
                    EndMinutes = 12 * 60,
                    Status = BookingStatus.Active
                },
                new Booking
                {
                    RoomId = room807.Id,
                    UserId = approvedUser.Id,
                    Date = today.AddDays(1),
                    StartMinutes = 14 * 60,
                    EndMinutes = 16 * 60,
                    Status = BookingStatus.Active
                });
        }

        await db.SaveChangesAsync();
    }
}

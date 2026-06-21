using MeetingRoomBooking.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetingRoomBooking.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<BlockedEmail> BlockedEmails => Set<BlockedEmail>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<BlockedEmail>()
            .HasIndex(b => b.Email)
            .IsUnique();

        modelBuilder.Entity<Room>()
            .HasIndex(r => r.Code)
            .IsUnique();

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Room)
            .WithMany(r => r.Bookings)
            .HasForeignKey(b => b.RoomId);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId);
    }
}

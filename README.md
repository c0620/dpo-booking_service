# Бронирование переговорных — МИРЭА

Учебный full-stack проект: React + Bootstrap (фронтенд), ASP.NET Core Web API + SQLite (бэкенд).

## Запуск

### Backend

```bash
cd backend/MeetingRoomBooking.Api
dotnet run
```

API: http://localhost:5154  
Swagger: http://localhost:5154/swagger  
Health: http://localhost:5154/health

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение: http://localhost:5173

## Тестовые аккаунты

| Email | Пароль | Роль |
|-------|--------|------|
| admin@edu.ru | admin123 | Администратор |
| user@edu.ru | user123 | Подтверждённый пользователь |
| student@edu.ru | student | Ожидает подтверждения |

Регистрация доступна только для `@edu.ru` и `@mirea.ru`.

## Структура

- `backend/MeetingRoomBooking.Api` — Web API, JWT, EF Core, SQLite
- `frontend` — React, Bootstrap, карта SVG, бронирование 9:00–18:00
- `auth guide.txt` — справочник по JWT из лекции

## Дизайн

UI реализован по макетам Figma «Диплом ЦК Бронирование». Ассеты скачаны в `frontend/public/assets/`.  
Шрифт Involve заменён на Inter (близкий аналог).

## Функционал

- Карта переговорок с зумом и выбором комнаты
- Бронирование с таймлайном (3 дня + календарь)
- Регистрация с модерацией администратором
- Уведомления в профиле
- История бронирований
- Админ-панель: пользователи, бронирования, отмена с комментарием

import { useEffect, useState } from "react";
import { authApi, profileApi } from "../api/client";
import type { Notification } from "../api/types";
import { useAuth } from "../context/AuthContext";

export function ProfilePage() {
  const auth = useAuth();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState(auth.displayName ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    setError(null);
    setPassword("");
    setConfirmPassword("");
    setEmail("");

    profileApi
      .get()
      .then((p) => {
        setDisplayName(p.displayName);
        auth.updateStatus(p.status);
      })
      .catch(() => undefined);

    profileApi
      .getNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, [auth.isAuthenticated, auth.userId]);

  const loadAfterAuth = async () => {
    try {
      const [profile, notifs] = await Promise.all([
        profileApi.get(),
        profileApi.getNotifications(),
      ]);
      setDisplayName(profile.displayName);
      setNotifications(notifs);
    } catch {
      setNotifications([]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    try {
      const res = await authApi.register({ email, password, displayName });
      auth.setAuth(res);
      setMessage(
        "Регистрация отправлена. Ожидайте подтверждения администратора."
      );
      setPassword("");
      setConfirmPassword("");
      await loadAfterAuth();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { title?: string } } })
        ?.response?.data?.title;
      setError(msg ?? "Ошибка регистрации");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await authApi.login({ email, password });
      auth.setAuth(res);
      setMessage("Вход выполнен");
      setPassword("");
      setConfirmPassword("");
      await loadAfterAuth();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { title?: string } } })
        ?.response?.data?.title;
      setError(msg ?? "Ошибка входа");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const profile = await profileApi.update({
        displayName,
        newPassword: newPassword || undefined,
        confirmPassword: confirmNewPassword || undefined,
      });
      auth.updateDisplayName(profile.displayName);
      setNewPassword("");
      setConfirmNewPassword("");
      setMessage("Профиль сохранён");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { title?: string } } })
        ?.response?.data?.title;
      setError(msg ?? "Ошибка сохранения");
    }
  };

  return (
    <div className="main-area profile-page">
      <div className="control-panel">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h1 className="panel-title h1">
            {auth.isAuthenticated
              ? "Профиль"
              : mode == "register"
              ? "Регистрация"
              : "Вход"}
          </h1>
          <button
            type="button"
            className="btn-secondary h2"
            onClick={() => {
              auth.isAuthenticated
                ? auth.logout()
                : mode == "register"
                ? setMode("login")
                : setMode("register");
              setError(null);
            }}
          >
            {auth.isAuthenticated
              ? "Выйти"
              : mode == "register"
              ? "Вход"
              : "Регистрация"}
          </button>
        </div>

        <div
          className={auth.isAuthenticated ? "profile-layout" : "profile-form"}
        >
          <div className="profile-form">
            {auth.isAuthenticated ? (
              <>
                <h2 className="h2" style={{ marginBottom: 12 }}>
                  Мои данные
                </h2>
                <form onSubmit={handleSave} className="profile-form">
                  <div>
                    <div className="form-field mb-3">
                      <label className="b2">Адрес электронной почты</label>
                      <div className="hint">
                        Будет виден другим пользователям и может потребоваться
                        для получения обратной связи
                      </div>
                      <input value={auth.email ?? ""} readOnly />
                    </div>
                    <div className="form-field mb-3">
                      <label className="b2">Имя</label>
                      <div className="hint">
                        Будет видно другим пользователям
                      </div>
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                    <div className="form-field mb-3">
                      <label className="b2">Пароль</label>
                      <div className="hint">
                        Введите от 5 символов (оставьте пустым, чтобы не менять)
                      </div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    {newPassword && (
                      <div className="form-field mb-3">
                        <label className="b2">Повтор пароля</label>
                        <div className="hint">
                          Повторите набранный выше пароль
                        </div>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) =>
                            setConfirmNewPassword(e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-custom b2"
                    style={{ height: 40 }}
                  >
                    Сохранить
                  </button>
                </form>
              </>
            ) : mode === "register" ? (
              <form onSubmit={handleRegister} className="profile-form">
                <div>
                  <div className="form-field mb-3">
                    <label className="b2">Адрес электронной почты</label>
                    <div className="hint">Только @edu.ru или @mirea.ru</div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field mb-3">
                    <label className="b2">Имя</label>
                    <div className="hint">Будет видно другим пользователям</div>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field mb-3">
                    <label className="b2">Пароль</label>
                    <div className="hint">Введите от 5 символов</div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={5}
                    />
                  </div>
                  <div className="form-field mb-3">
                    <label className="b2">Повтор пароля</label>
                    <div className="hint">Повторите набранный выше пароль</div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary-custom b2"
                  style={{ height: 40 }}
                >
                  Зарегистрироваться
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="profile-form">
                <div>
                  <div className="form-field mb-3">
                    <label className="b2">Адрес электронной почты</label>
                    <div className="hint">
                      К которому привязан ваш аккаунт (домен edu.ru или
                      mirea.ru)
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field mb-3">
                    <label className="b2">Пароль</label>
                    <div className="hint">Пароль от аккаунта</div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary-custom b2"
                  style={{ height: 40 }}
                >
                  Войти
                </button>
              </form>
            )}

            {message && <p className="mt-3 text-info">{message}</p>}
            {error && <p className="mt-3 text-danger">{error}</p>}
          </div>

          {auth.isAuthenticated && (
            <div className="notifications-panel">
              <h2 className="h2" style={{ marginBottom: 12 }}>
                Уведомления
              </h2>
              {notifications.length === 0 && <p>Нет уведомлений</p>}
              {notifications.map((n) => (
                <div key={n.id} className="notification-card mb-3">
                  <div className="meta">
                    <span>{n.sender}</span>
                    <span>{n.createdAt}</span>
                  </div>
                  <div style={{ fontWeight: 700 }}>{n.title}</div>
                  <div style={{ fontSize: 13 }}>{n.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

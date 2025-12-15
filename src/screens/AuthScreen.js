// src/screens/AuthScreen.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import "./AuthScreen.css";

export default function AuthScreen({ isRegister }) {
  const [formData, setFormData] = useState({
    lastname: "",
    firstname: "",
    middlename: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;

    try {
      setLoading(true);
      setError("");

      if (isRegister) {
        // Регистрация
        if (!formData.lastname || !formData.firstname || !formData.email || !formData.password) {
          setError("Заполните все обязательные поля");
          return;
        }

        await authAPI.register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstname,
          lastName: formData.lastname,
          role: "User"
        });

        alert("Регистрация успешна! Теперь войдите в систему.");
        navigate("/login");
        
      } else {
        // Вход
        if (!formData.email || !formData.password) {
          setError("Заполните email и пароль");
          return;
        }

        const result = await authAPI.login({
          email: formData.email,
          password: formData.password
        });

        if (result.token) {
          localStorage.setItem("authToken", result.token);
          
          try {
            const { initAuth } = await import("../services/auth");
            initAuth(result.token);
          } catch (authError) {
            console.warn("Не удалось инициализировать обновление токена:", authError);
          }
          
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError(error.message || "Произошла ошибка при подключении к серверу");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuth = () => {
    // Просто переходим на другую страницу (регистрация/вход)
    const targetPath = isRegister ? "/login" : "/register";
    navigate(targetPath);
  };

  return (
    <div className="registration-container">
      <div className="form-image">
        <img src="/RegLogo.png" alt="Фрейм" />
      </div>

      <div className="form-content">
        {isRegister ? (
          <>
            <h1 className="registration-title">Регистрация</h1>
            {error && <div className="error-message">{error}</div>}
            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="lastname" className="required">Фамилия</label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Введите фамилию"
                />
              </div>

              <div className="form-group">
                <label htmlFor="firstname" className="required">Имя</label>
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Введите имя"
                />
              </div>

              <div className="form-group">
                <label htmlFor="middlename">Отчество</label>
                <input
                  type="text"
                  id="middlename"
                  name="middlename"
                  value={formData.middlename}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Введите отчество (необязательно)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="required">Эл. почта</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="example@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="required">Телефон</label>
                <div className="phone-input">
                  <span className="phone-prefix">+7</span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="9001234567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="required">Пароль</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Введите пароль"
                />
              </div>

              <div className="form-buttons">
                <button 
                  type="button" 
                  className="btn btn-cancel" 
                  onClick={handleToggleAuth}
                  disabled={loading}
                >
                  Уже есть аккаунт?
                </button>
                <button 
                  type="submit" 
                  className="btn btn-save" 
                  disabled={loading}
                >
                  {loading ? "Загрузка..." : "Зарегистрироваться"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="registration-title">Вход</h1>
            {error && <div className="error-message">{error}</div>}
            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="login-email" className="required">Эл. почта</label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="example@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password" className="required">Пароль</label>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Введите пароль"
                />
              </div>

              <div className="form-buttons">
                <button 
                  type="button" 
                  className="btn btn-cancel" 
                  onClick={handleToggleAuth}
                  disabled={loading}
                >
                  Регистрация
                </button>
                <button 
                  type="submit" 
                  className="btn btn-save" 
                  disabled={loading}
                >
                  {loading ? "Вход..." : "Войти"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
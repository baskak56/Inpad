// src/screens/ProfileScreen.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileScreen.css";

export default function ProfileScreen({ onClose }) {
  const navigate = useNavigate();

  // Функция закрытия профиля
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    navigate(-1); // Возврат на предыдущую страницу
  };

  // Обработка нажатия Escape
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    
    // Блокируем скролл на фоне
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "auto";
    };
  }, [navigate, onClose]);

  // Обработчик клика по оверлею
  const handleOverlayClick = (e) => {
    if (e.target.className === "profile-modal-overlay") {
      handleClose();
    }
  };

  // Функция для получения данных пользователя
  const getUserData = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : {
      email: "user@example.com",
      role: "Пользователь",
      name: "Иван Иванов",
      createdAt: new Date().toISOString()
    };
  };

  const user = getUserData();

  return (
    <div className="profile-modal-overlay" onClick={handleOverlayClick}>
      <div className="profile-modal">
        <div className="profile-modal-header">
          <h2>Профиль пользователя</h2>
          <button 
            className="close-btn" 
            onClick={handleClose}
            aria-label="Закрыть профиль"
          >
            ✕
          </button>
        </div>
        
        <div className="profile-modal-content">
          <div className="profile-info">
            <div className="profile-field">
              <label>Имя:</label>
              <span>{user.name || "Не указано"}</span>
            </div>
            
            <div className="profile-field">
              <label>Email:</label>
              <span>{user.email || "Не указан"}</span>
            </div>
            
            <div className="profile-field">
              <label>Роль:</label>
              <span>{user.role || "Пользователь"}</span>
            </div>
            
            <div className="profile-field">
              <label>Дата регистрации:</label>
              <span>
                {user.createdAt ? 
                  new Date(user.createdAt).toLocaleDateString("ru-RU", {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 
                  "Не указана"
                }
              </span>
            </div>
          </div>
          
          <div className="profile-actions">
            <button 
              className="profile-action-btn"
              onClick={() => {
                alert("Функция редактирования профиля в разработке");
              }}
            >
              <span>✏️ Редактировать профиль</span>
            </button>
            
            <button 
              className="profile-action-btn"
              onClick={() => {
                alert("Функция смены пароля в разработке");
              }}
            >
              <span>🔒 Сменить пароль</span>
            </button>
            
            <button 
              className="profile-action-btn"
              onClick={() => {
                if (window.confirm("Вы уверены, что хотите выйти из системы?")) {
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("user");
                  navigate("/login");
                }
              }}
            >
              <span>🚪 Выйти из системы</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
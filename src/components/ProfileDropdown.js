// src/components/ProfileDropdown.js
import React, { useState, useRef, useEffect } from "react";
import "./ProfileDropdown.css";

export default function ProfileDropdown({ onLogout, onProfileClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // В ProfileDropdown.js обновить функции:
    const handleProfileClick = () => {
        setIsOpen(false);
        onProfileClick(); // Теперь это откроет модальное окно, а не перейдет на страницу
    };

    const handleLogout = () => {
        setIsOpen(false);
        onLogout();
    };

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button className="header-btn profile-btn" onClick={toggleDropdown}>
         <img src="/profile.png" alt="Уведомления" width="34" height="40" />
      </button>
      
      {isOpen && (
        <div className="profile-menu">
          <button className="profile-menu-item" onClick={handleProfileClick}>
            📊 Информация
          </button>
          <button className="profile-menu-item">
            ⚙️ Настройки
          </button>
          <button className="profile-menu-item logout" onClick={handleLogout}>
            🚪 Выйти из аккаунта
          </button>
        </div>
      )}
    </div>
  );
}
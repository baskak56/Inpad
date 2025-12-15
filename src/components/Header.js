// src/components/Header.js
import { useNavigate } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate("/profile"); // Переход на страницу профиля через роутинг
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("dashboardCurrentContent");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  return (
    <header className="App-header">
      <img 
        src="/Спецпроект.png" 
        alt="Логотип" 
        width="257" 
        height="57" 
        onClick={handleHomeClick}
        style={{ cursor: "pointer" }}
      />
      
      <div className="three">
        <button className="header-btn">
          <img src="/notification.png" alt="Уведомления" width="34" height="40" />
        </button>
        
        <ProfileDropdown 
          onLogout={handleLogout}
          onProfileClick={handleProfileClick}
        />
      </div>
    </header>
  );
}
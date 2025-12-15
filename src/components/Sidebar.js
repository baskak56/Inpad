// src/components/Sidebar.js (упрощенная)
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ 
  isOpen, 
  toggleMenu, 
  openSubmenu, 
  toggleSubmenu,
  userRole
}) {
  const navigate = useNavigate();

  const handleMenuClick = (e, path) => {
    e.stopPropagation();
    if (path) {
      navigate(path);
      toggleMenu();
    }
  };

  const handleSidebarClick = (e) => {
    if (!isOpen) {
      toggleMenu();
      return;
    }
    
    const sidebarRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - sidebarRect.left;
    const clickY = e.clientY - sidebarRect.top;
    
    const isArrowClick = clickX > sidebarRect.width - 50 && clickY < 50;
    
    if (isArrowClick) {
      toggleMenu();
    }
  };

  return (
    <div 
      className={`sidebar ${isOpen ? "open" : ""}`}
      onClick={handleSidebarClick}
    >
      {isOpen && (
        <ul>
          {/* Проекты */}
          <li 
            className="menu-item" 
            onClick={(e) => toggleSubmenu("projects")}
          >
            <div className="menu-header" classname = "project">
              <span>Проекты</span>
              <span className={`arrow ${openSubmenu === "projects" ? "open" : ""}`}>▼</span>
            </div>
            {openSubmenu === "projects" && (
              <ul className="submenu">
                <li onClick={(e) => handleMenuClick(e, "/dashboard/projects")}>Мои проекты</li>
                
                {userRole === "Admin" && (
                  <li onClick={(e) => handleMenuClick(e, "/dashboard/admin-projects")}>Управление проектами</li>
                )}
                <li onClick={(e) => handleMenuClick(e, "/dashboard/archive")}>Архив проектов</li>
              </ul>
            )}
          </li>

          {/* Администрирование - только для Admin */}
          {userRole === "Admin" && (
            <li 
              className="menu-item" 
              onClick={(e) => toggleSubmenu("admin")}
            >
              <div className="menu-header">
                <span>Администрирование</span>
                <span className={`arrow ${openSubmenu === "admin" ? "open" : ""}`}>▼</span>
              </div>
              {openSubmenu === "admin" && (
                <ul className="submenu">
                  <li onClick={(e) => handleMenuClick(e, "/dashboard/admin")}>Пользователи</li>
                  <li onClick={(e) => handleMenuClick(e, "/dashboard/admin-projects")}>Проекты</li>
                </ul>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
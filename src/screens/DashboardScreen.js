import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from '../services/useAuth';
import { useAppContext } from "../services/AppContext";
import ProfileScreen from "./ProfileScreen";
import AdminTable from "../components/AdminTable";
import ProjectManagement from "../components/ProjectManagement";
import AdminProjectManagement from "../components/AdminProjectManagement";
import "./DashboardScreen.css";

export default function DashboardScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const { user: authUser, loading: authLoading } = useAuth();
   const { setUser, loading } = useAppContext();
  
  // Определяем текущий контент из URL
  const getContentFromPath = () => {
    const path = location.pathname;
    
    if (path === "/" || path === "/dashboard") return "welcome";
    if (path === "/dashboard/admin") return "admin";
    if (path === "/dashboard/admin-projects") return "admin-projects";
    if (path.includes("/dashboard/projects")) return "projects";
    return "welcome";
  };

  const getProjectIdFromPath = () => {
    const match = location.pathname.match(/\/dashboard\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/supplies")) return "supplies";
    if (path.includes("/inspections")) return "inspections";
    if (path.includes("/warehouse")) return "warehouse";
    if (path.includes("/writeoff")) return "writeoff";
    return "supplies";
  };

  const [currentContent, setCurrentContent] = useState(getContentFromPath());
  const [activeProjectId, setActiveProjectId] = useState(getProjectIdFromPath());
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Синхронизация с контекстом
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
  }, [authUser, setUser]);

  // Обновляем контент при изменении URL
  useEffect(() => {
    setCurrentContent(getContentFromPath());
    const projectId = getProjectIdFromPath();
    if (projectId) {
      setActiveProjectId(projectId);
    }
    
    const tab = getActiveTabFromPath();
    setActiveTab(tab);
  }, [location.pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleSubmenu = (menuName) => {
    setOpenSubmenu(openSubmenu === menuName ? null : menuName);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setShowProfile(false);
    navigate("/login");
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleWelcomeClick = () => {
    navigate("/");
  };

  const handleAdminClick = () => {
    navigate("/dashboard/admin");
  };

  const handleProjectsClick = () => {
    navigate("/dashboard/projects");
  };

  const handleAdminProjectsClick = () => {
    navigate("/dashboard/admin-projects");
  };

  const supplyStatusOptions = [
    "в пути",
    "на складе", 
    "проверяется",
    "доставлено",
    "отменено",
    "возврат",
    "задержано"
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case "создана": return "status-created";
      case "Доставлено": return "status-delivered";
      case "В пути": return "status-in-transit";
      case "ожидается": return "status-pending";
      case "Отменено": return "status-cancelled";
      case "Задержано": return "status-delayed";
      case "Одобрено": return "status-approved";
      case "Отклонено": return "status-rejected";
      default: return "";
    }
  };

  if (authLoading) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="loading">Проверка авторизации...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        isOpen={isOpen}
        toggleMenu={toggleMenu}
        openSubmenu={openSubmenu}
        toggleSubmenu={toggleSubmenu}
        handleAdminClick={handleAdminClick}
        handleProjectsClick={handleProjectsClick}
        handleAdminProjectsClick={handleAdminProjectsClick}
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
        userRole={authUser?.role || "Viewer"}
      />
      
      {showProfile && (
        <ProfileScreen onClose={() => setShowProfile(false)} />
      )}
      
      <div className="main-content">
        {currentContent === "welcome" && (
          <div className="welcome-container">
            <h1>Добро пожаловать!</h1>
            <p>Управляйте вашими поставками и проектами.</p>
          </div>
        )}
        
        {currentContent === "projects" && (
          <ProjectManagement
            activeProjectId={activeProjectId}
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (activeProjectId) {
                navigate(`/dashboard/projects/${activeProjectId}/${tab}`);
              }
            }}
            onProjectSelect={(projectId) => {
              setActiveProjectId(projectId);
              navigate(`/dashboard/projects/${projectId}/${activeTab}`);
            }}
            supplyStatusOptions={supplyStatusOptions}
            getStatusClass={getStatusClass}
            userRole={authUser?.role || "Viewer"}
          />
        )}
        
        {currentContent === "admin" && (
  <>
    <div className="supply-header">
      <h1>Управление пользователями</h1>
      <button onClick={handleWelcomeClick} className="back-btn">
        ← Назад
      </button>
    </div>
    
    <AdminTable loading={loading.users} />
  </>
)}

{currentContent === "admin-projects" && (
  <>
    <div className="supply-header">
      <h1>Управление проектами</h1>
      <button onClick={handleWelcomeClick} className="back-btn">
        ← Назад
      </button>
    </div>
    
    <AdminProjectManagement 
      loading={loading.projects}
      userRole={authUser?.role || "Viewer"}
    />
  </>
)}
      </div>
    </div>
  );
}
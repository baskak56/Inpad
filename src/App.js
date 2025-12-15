// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppProvider } from "./services/AppContext";
import "./App.css";
import AuthScreen from "./screens/AuthScreen";
import DashboardScreen from "./screens/DashboardScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import { useEffect, useState } from "react";

// Компонент для условного отображения Header
function ConditionalHeader() {
  const location = useLocation();
  const [showHeader, setShowHeader] = useState(false);
  
  useEffect(() => {
    // Проверяем, является ли текущий маршрут публичным (логин/регистрация)
    const isPublicRoute = ['/login', '/register'].includes(location.pathname);
    const token = localStorage.getItem("authToken");
    
    // Показываем Header только если есть токен И это не публичный маршрут
    setShowHeader(!!token && !isPublicRoute);
  }, [location.pathname]);
  
  if (!showHeader) return null;
  
  return <Header />;
}

// Основной компонент приложения
function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          {/* Header показывается условно */}
          <ConditionalHeader />
          
          <main>
            <Routes>
              {/* Публичные маршруты (доступны без авторизации) */}
              <Route path="/login" element={<AuthScreen isRegister={false} />} />
              <Route path="/register" element={<AuthScreen isRegister={true} />} />
              
              {/* Приватные маршруты (требуют авторизации) */}
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardScreen />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardScreen />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfileScreen onClose={() => window.history.back()} />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/projects" element={
                <ProtectedRoute>
                  <DashboardScreen />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/projects/:projectId/:tab?" element={
                <ProtectedRoute>
                  <DashboardScreen />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/admin" element={
                <ProtectedRoute>
                  <DashboardScreen />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/admin-projects" element={
                <ProtectedRoute>
                  <DashboardScreen />
                </ProtectedRoute>
              } />
              
              {/* Редирект для неавторизованных пользователей на логин, для авторизованных - на dashboard */}
              <Route path="*" element={
                localStorage.getItem("authToken") 
                  ? <Navigate to="/dashboard" replace /> 
                  : <Navigate to="/login" replace />
              } />
            </Routes>
          </main>
          
          {/* Toast контейнер */}
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
// src/components/ProtectedRoute.js
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken");
  
  // Только одна проверка - есть ли токен в localStorage
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
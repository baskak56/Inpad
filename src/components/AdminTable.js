// src/components/AdminTable.js
import React from "react";
import { useAppContext } from  "../services/AppContext";
import "./AdminTable.css";
import { showToast } from '../utils/toast';

export default function AdminTable({ loading }) {
  const { 
    adminUsers, 
    handleRoleChange, 
    handleDeleteUser 
  } = useAppContext();
  
  const roleOptions = ["Admin", "Manager", "Inspector", "Viewer", "User"];

  const formatUserName = (user) => {
    const parts = [user.lastName, user.firstName, user.middleName].filter(Boolean);
    return parts.join(" ") || "Не указано";
  };

  const handleRoleChangeInternal = async (userId, newRole) => {
    try {
      await handleRoleChange(userId, newRole);
      showToast.success("Роль пользователя успешно изменена");
    } catch (error) {
      showToast.error("Не удалось изменить роль: " + error.message);
    }
  };

  const handleDeleteUserInternal = async (userId, userName) => {
    showToast.confirm(`Удалить пользователя ${userName}?`, {
  onConfirm: async () => {
    try {
      await handleDeleteUser(userId);
      showToast.success(`Пользователь ${userName} удален`);
    } catch (error) {
      showToast.error("Не удалось удалить пользователя: " + error.message);
    }
  },
  confirmText: 'Удалить',
  cancelText: 'Отмена'
});
return;
    
    try {
      await handleDeleteUser(userId);
      alert(`Пользователь ${userName} удален`);
    } catch (error) {
      alert("Не удалось удалить пользователя: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="table-wrapper">
        <div className="loading">Загрузка пользователей...</div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>№</th>
            <th>ФИО</th>
            <th>Email</th>
            <th>Роль</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {adminUsers.length === 0 ? (
            <tr>
              <td colSpan="5" className="empty-table">
                Нет данных о пользователях
              </td>
            </tr>
          ) : (
            adminUsers.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td className="user-name">{formatUserName(user)}</td>
                <td>{user.email || "—"}</td>
                <td>
                  <select
                    value={user.role || "User"}
                    onChange={(e) => handleRoleChangeInternal(user.id, e.target.value)}
                    className="role-select"
                    disabled={loading}
                  >
                    {roleOptions.map(role => (
                      <option key={role} value={role}>
                        {role === "Admin" ? "Администратор" :
                         role === "Manager" ? "Менеджер" :
                         role === "Inspector" ? "Инспектор" :
                         role === "Viewer" ? "Наблюдатель" : "Пользователь"}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button 
                    className="delete-user-btn"
                    onClick={() => handleDeleteUserInternal(user.id, formatUserName(user))}
                    title="Удалить пользователя"
                    disabled={loading}
                  >
                    🗑️ {loading ? "Удаление..." : "Удалить"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
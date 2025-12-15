// src/components/AdminProjectManagement.js
import React, { useState } from 'react';
import { useAppContext } from "../services/AppContext";
import './ProjectManagement.css';
import { showToast } from '../utils/toast';

export default function AdminProjectManagement({ 
  loading,
  userRole
}) {
  const {
    projects,
    adminUsers,
    projectUsers,
    handleCreateProject,
    handleAddUserToProject,
    handleRemoveUserFromProject,
    handleDeleteProject,
    loadProjectUsers
  } = useAppContext();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false);
  
  const [newProject, setNewProject] = useState({
    name: '',
    address: ''
  });
  const [newUserAssignment, setNewUserAssignment] = useState({
    projectId: '',
    userId: '',
    role: 'Viewer'
  });

  // 🔥 ФУНКЦИЯ УДАЛЕНИЯ ПРОЕКТА
  const handleDeleteProjectInternal = async (projectId, projectName) => {
    if (!projectId) return;
    
    showToast.confirm(
  `Вы уверены, что хотите удалить проект "${projectName}"?\n\nЭто действие удалит все связанные данные и не может быть отменено.`,
  {
    onConfirm: async () => {
      // Дополнительное подтверждение
      showToast.confirm(
        `⚠️ ВНИМАНИЕ! Это окончательное удаление.\nПроект "${projectName}" и все его данные будут удалены навсегда.\n\nПродолжить?`,
        {
          onConfirm: async () => {
            try {
              await handleDeleteProject(projectId);
              if (expandedProject === projectId) {
                setExpandedProject(null);
              }
              showToast.success(`Проект "${projectName}" успешно удален.`);
            } catch (error) {
              showToast.error(`Ошибка при удалении проекта: ${error.message}`);
              console.error('Ошибка при удалении проекта:', error);
            }
          },
          confirmText: 'Удалить',
          cancelText: 'Отмена'
        }
      );
    },
    confirmText: 'Продолжить',
    cancelText: 'Отмена'
  }
);
return;
    // Дополнительное подтверждение для важного действия
    if (!window.confirm(`⚠️ ВНИМАНИЕ! Это окончательное удаление.\nПроект "${projectName}" и все его данные (поставки, проверки, пользователи) будут удалены навсегда.\n\nПродолжить?`)) {
      return;
    }
    
    try {
      await handleDeleteProject(projectId);
      
      // Если удаляем текущий выбранный проект, сбрасываем выбор
      if (expandedProject === projectId) {
        setExpandedProject(null);
      }
      
      alert(`Проект "${projectName}" успешно удален.`);
    } catch (error) {
      console.error('Ошибка при удалении проекта:', error);
      alert(`Ошибка при удалении проекта: ${error.message}`);
    }
  };

  const handleCreateProjectInternal = async (e) => {
    e.preventDefault();
    try {
      await handleCreateProject(newProject);
      setShowCreateForm(false);
      setNewProject({ name: '', address: '' });
      showToast.success('Проект успешно создан!');
    } catch (error) {
      showToast.error('Ошибка создания проекта: ' + error.message);
    }
  };

  const handleAddUserInternal = async (e) => {
    e.preventDefault();
    try {
      await handleAddUserToProject(
        newUserAssignment.projectId,
        newUserAssignment.userId,
        newUserAssignment.role
      );
      setNewUserAssignment({ projectId: '', userId: '', role: 'Viewer' });
      
      // Если добавляем в выбранный проект, обновляем список пользователей
      if (expandedProject === newUserAssignment.projectId) {
        await loadProjectUsers(newUserAssignment.projectId);
      }
      
      alert('Пользователь успешно добавлен в проект!');
    } catch (error) {
      alert('Ошибка добавления пользователя: ' + error.message);
    }
  };

  const toggleProjectExpansion = async (projectId) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
      setActiveTab('users');
    } else {
      setExpandedProject(projectId);
      await loadProjectUsers(projectId);
    }
  };

  const toggleProjectsCollapse = () => {
    setIsProjectsCollapsed(!isProjectsCollapsed);
  };

  const formatUserName = (user) => {
    if (user.fullName) return user.fullName;
    const parts = [user.lastName, user.firstName, user.middleName].filter(Boolean);
    return parts.join(" ") || user.email || "Не указано";
  };

  // 🔥 ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ПОЛЬЗОВАТЕЛЕЙ ПРОЕКТА
  const getCurrentProjectUsers = () => {
    if (!expandedProject) return [];
    return projectUsers[expandedProject] || [];
  };

  // 🔥 ФУНКЦИЯ ДЛЯ УДАЛЕНИЯ ПОЛЬЗОВАТЕЛЯ ИЗ ПРОЕКТА
  const handleRemoveUserInternal = async (userId) => {
  if (!expandedProject) return;
  
  showToast.confirm("Вы уверены, что хотите удалить пользователя из проекта?", {
    onConfirm: async () => {
      try {
        await handleRemoveUserFromProject(expandedProject, userId);
        showToast.success('Пользователь удален из проекта');
      } catch (error) {
        showToast.error('Ошибка удаления пользователя: ' + error.message);
      }
    },
    confirmText: 'Удалить',
    cancelText: 'Отмена'
  });
};

  // 🔥 ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ВСЕХ ПРОЕКТОВ ПОЛЬЗОВАТЕЛЯ
  const getUserProjects = (userId) => {
    const userProjects = [];
    Object.keys(projectUsers).forEach(projectId => {
      const usersInProject = projectUsers[projectId] || [];
      const userInProject = usersInProject.find(user => user.id === userId || user.userId === userId);
      if (userInProject) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          userProjects.push({
            project: project,
            role: userInProject.role || 'Viewer'
          });
        }
      }
    });
    return userProjects;
  };

  // 🔥 РЕНДЕРИНГ ТАБЛИЦЫ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
  const renderAllUsersTable = () => {
    return (
      <div className="all-users-section">
        <h3>Все пользователи системы</h3>
        {adminUsers.length === 0 ? (
          <div className="empty-message">
            <p>Нет пользователей в системе</p>
          </div>
        ) : (
          <div className="all-users-table">
            <table>
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Email</th>
                  <th>Глобальная роль</th>
                  <th>Проекты</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => {
                  const userProjectsList = getUserProjects(user.id);
                  return (
                    <tr key={user.id}>
                      <td>{formatUserName(user)}</td>
                      <td>{user.email || "—"}</td>
                      <td>
                        <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                          {user.role === "Admin" ? "Администратор" :
                           user.role === "Manager" ? "Менеджер" :
                           user.role === "Inspector" ? "Инспектор" :
                           user.role === "Viewer" ? "Наблюдатель" : "Пользователь"}
                        </span>
                      </td>
                      <td>
                        {userProjectsList.length === 0 ? (
                          <span className="no-projects">Нет проектов</span>
                        ) : (
                          <div className="user-projects-list">
                            {userProjectsList.map((userProject, index) => (
                              <div key={index} className="user-project-item">
                                <span className="project-name">{userProject.project.name}</span>
                                <span className={`project-role role-${userProject.role.toLowerCase()}`}>
                                  ({userProject.role === "Admin" ? "Админ" :
                                    userProject.role === "Manager" ? "Менеджер" :
                                    userProject.role === "Inspector" ? "Инспектор" : "Наблюдатель"})
                                </span>
                                <button 
                                  className="remove-user-btn"
                                  onClick={() => handleRemoveUserInternal(user.id)}
                                  title="Удалить из проекта"
                                  disabled={loading}
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // РЕНДЕРИНГ КОНТЕНТА ПРОЕКТА С ВКЛАДКАМИ
  const renderProjectContent = () => {
    if (!expandedProject) {
      return <div className="no-project-selected">Выберите проект для просмотра деталей</div>;
    }

    const currentProjectUsers = getCurrentProjectUsers();
    const currentProject = projects.find(p => p.id === expandedProject) || {};

    return (
      <div className="project-details">
        <div className="project-header">
          <div className="project-title-section">
            <h3>{currentProject.name}</h3>
            <span className="project-address">{currentProject.address}</span>
          </div>
          
          {/* 🔥 КНОПКА УДАЛЕНИЯ ПРОЕКТА */}
          <div className="project-actions">
            <button 
              className="delete-project-btn danger"
              onClick={() => handleDeleteProjectInternal(currentProject.id, currentProject.name)}
              title="Удалить проект"
              disabled={loading}
            >
              🗑️ Удалить проект
            </button>
          </div>
        </div>

        {/* ВКЛАДКИ ТОЛЬКО ДЛЯ АДМИНИСТРИРОВАНИЯ */}
        <div className="project-tabs">
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Пользователи проекта ({currentProjectUsers.length})
          </button>
        </div>

        {/* КОНТЕНТ ВКЛАДОК */}
        <div className="tab-content">
          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="tab-section">
                <h4>Пользователи в проекте "{currentProject.name}"</h4>
                {currentProjectUsers.length === 0 ? (
                  <div className="empty-message">
                    <p>В проекте нет пользователей</p>
                  </div>
                ) : (
                  <div className="users-table">
                    <table>
                      <thead>
                        <tr>
                          <th>ФИО</th>
                          <th>Email</th>
                          <th>Роль в проекте</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProjectUsers.map((user, index) => (
                          <tr key={user.id || user.userId || index}>
                            <td>{formatUserName(user)}</td>
                            <td>{user.email || "—"}</td>
                            <td>
                              <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                                {user.role === "Admin" ? "Администратор" :
                                 user.role === "Manager" ? "Менеджер" :
                                 user.role === "Inspector" ? "Инспектор" :
                                 user.role === "Viewer" ? "Наблюдатель" : "Пользователь"}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="remove-user-btn"
                                onClick={() => handleRemoveUserInternal(user.id || user.userId)}
                                title="Удалить из проекта"
                                disabled={loading}
                              >
                                🗑️ Удалить
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="project-management">
      {/* ФОРМА СОЗДАНИЯ ПРОЕКТА ТОЛЬКО ДЛЯ АДМИНОВ */}
      {userRole === "Admin" && (
        <div className="project-form-section">
          {showCreateForm ? (
            <form onSubmit={handleCreateProjectInternal} className="create-project-form">
              <h3>Создать новый проект</h3>
              <div className="form-group">
                <label>Название проекта:</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Адрес:</label>
                <input
                  type="text"
                  value={newProject.address}
                  onChange={(e) => setNewProject({...newProject, address: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Создание...' : 'Создать проект'}
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setShowCreateForm(true)} 
              className="add-project-btn"
            >
              + Создать проект
            </button>
          )}
        </div>
      )}

      {/* ФОРМА ДОБАВЛЕНИЯ ПОЛЬЗОВАТЕЛЕЙ ТОЛЬКО ДЛЯ АДМИНОВ */}
      {userRole === "Admin" && (
        <div className="add-user-section">
          <h3>Добавить пользователя в проект</h3>
          <form onSubmit={handleAddUserInternal} className="add-user-form">
            <div className="form-row">
              <div className="form-group">
                <label>Проект:</label>
                <select
                  value={newUserAssignment.projectId}
                  onChange={(e) => setNewUserAssignment({...newUserAssignment, projectId: e.target.value})}
                  required
                >
                  <option value="">Выберите проект</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Пользователь:</label>
                <select
                  value={newUserAssignment.userId}
                  onChange={(e) => setNewUserAssignment({...newUserAssignment, userId: e.target.value})}
                  required
                >
                  <option value="">Выберите пользователя</option>
                  {adminUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {formatUserName(user)} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Роль в проекте:</label>
                <select
                  value={newUserAssignment.role}
                  onChange={(e) => setNewUserAssignment({...newUserAssignment, role: e.target.value})}
                  required
                >
                  <option value="Viewer">Наблюдатель</option>
                  <option value="Manager">Менеджер</option>
                  <option value="Inspector">Инспектор</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Добавление...' : 'Добавить в проект'}
            </button>
          </form>
        </div>
      )}

      {/* 🔥 ТАБЛИЦА ВСЕХ ПОЛЬЗОВАТЕЛЕЙ - ПЕРВЫМ ЭЛЕМЕНТОМ */}
      {renderAllUsersTable()}

      {/* ОСНОВНОЙ КОНТЕНТ - ПРОЕКТЫ И ИХ ПОЛЬЗОВАТЕЛИ */}
      <div className={`projects-layout ${isProjectsCollapsed ? 'collapsed' : ''}`}>
        <div className="projects-list-container">
          <div className="projects-list-header">
            <h3>Проекты</h3>
            <button 
              className="toggle-sidebar-header-btn"
              onClick={toggleProjectsCollapse}
              title={isProjectsCollapsed ? "Показать проекты" : "Скрыть проекты"}
            >
              {isProjectsCollapsed ? '→' : '←'}
            </button>
          </div>
          
          {!isProjectsCollapsed && (
            <div className="projects-list">
              {projects.length === 0 ? (
                <p className="empty-message">
                  {userRole === "Admin" 
                    ? "Создайте первый проект" 
                    : "Нет доступных проектов"}
                </p>
              ) : (
                projects.map(project => (
                  <div 
                    key={project.id} 
                    className={`project-item ${expandedProject === project.id ? 'active' : ''}`}
                    onClick={() => toggleProjectExpansion(project.id)}
                  >
                    <div className="project-info">
                      <div className="project-header-row">
                        <h4>{project.name}</h4>
                        {/* 🔥 КНОПКА УДАЛЕНИЯ В СПИСКЕ ПРОЕКТОВ */}
                        <button 
                          className="delete-project-small-btn danger"
                          onClick={(e) => {
                            e.stopPropagation(); // Предотвращаем раскрытие проекта
                            handleDeleteProjectInternal(project.id, project.name);
                          }}
                          title="Удалить проект"
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </div>
                      <span className="project-address">{project.address}</span>
                      <div className="project-stats">
                        <small>
                          Пользователей: {(projectUsers[project.id] || []).length}
                        </small>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          <button 
            className="toggle-sidebar-btn"
            onClick={toggleProjectsCollapse}
            title={isProjectsCollapsed ? "Показать проекты" : "Скрыть проекты"}
          >
            {isProjectsCollapsed ? '→' : '←'}
          </button>
        </div>

        <div className="project-details-container">
          {renderProjectContent()}
        </div>
      </div>
    </div>
  );
}
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  suppliesAPI, 
  projectsAPI, 
  inspectionsAPI, 
  usersAPI, 
  userProjectsAPI,
  warehouseAPI 
} from "../services/api";
import { showToast } from '../utils/toast';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("Viewer");
  
  // Данные состояния
  const [projects, setProjects] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [inspectionSupplies, setInspectionSupplies] = useState([]);
  const [warehouseItems, setWarehouseItems] = useState({});
  const [adminUsers, setAdminUsers] = useState([]);
  const [projectUsers, setProjectUsers] = useState({});
  
  const [loading, setLoading] = useState({
    projects: false,
    supplies: false,
    users: false,
    warehouse: false
  });

  // 🔥 ЗАГРУЗКА ДАННЫХ
  const loadMyProjects = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, projects: true }));
      const myProjects = await projectsAPI.getMyProjects();
      setUserProjects(myProjects);
      return myProjects;
    } catch (error) {
      showToast.error("Ошибка загрузки проектов пользователя");
      console.error("Ошибка загрузки проектов пользователя:", error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  }, []);

  const loadAllProjects = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, projects: true }));
      const allProjects = await projectsAPI.getProjects();
      setProjects(allProjects);
      return allProjects;
    } catch (error) {
      showToast.error("Ошибка загрузки всех проектов");
      console.error("Ошибка загрузки всех проектов:", error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  }, []);

  const loadSupplies = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, supplies: true }));
      const data = await suppliesAPI.getSupplies();
      
      const transformedData = data.map(supply => ({
        ...supply,
        status: supply.deliveryStatus || supply.status || "создана"
      }));
      
      setSupplies(transformedData);
      
      // Фильтруем поставки для проверки
      const inspectionData = transformedData.filter(supply => {
        const hasDeliveredStatus = supply.status && supply.status.toLowerCase() === "доставлено";
        const hasDocuments = supply.documents && supply.documents.length > 0;
        return hasDeliveredStatus || hasDocuments;
      });

      setInspectionSupplies(inspectionData);
      
      return transformedData;
    } catch (error) {
      showToast.error("Ошибка загрузки поставок");
      console.error("Ошибка загрузки поставок:", error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, supplies: false }));
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      const users = await usersAPI.getUsers();
      setAdminUsers(users);
      return users;
    } catch (error) {
      showToast.error("Ошибка загрузки пользователей");
      console.error("Ошибка загрузки пользователей:", error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, []);

  const loadProjectWarehouse = useCallback(async (projectId) => {
    if (!projectId) return [];
    
    try {
      setLoading(prev => ({ ...prev, warehouse: true }));
      const data = await warehouseAPI.getWarehouseByProject(projectId);
      setWarehouseItems(prev => ({
        ...prev,
        [projectId]: data || []
      }));
      return data || [];
    } catch (error) {
      showToast.error("Ошибка загрузки склада");
      console.error("Ошибка загрузки склада:", error);
      setWarehouseItems(prev => ({
        ...prev,
        [projectId]: []
      }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, warehouse: false }));
    }
  }, []);

  const loadProjectUsers = useCallback(async (projectId) => {
    try {
      const users = await userProjectsAPI.getProjectUsers(projectId);
      setProjectUsers(prev => ({
        ...prev,
        [projectId]: users
      }));
      return users;
    } catch (error) {
      showToast.error("Ошибка загрузки пользователей проекта");
      console.error("Ошибка загрузки пользователей проекта:", error);
      setProjectUsers(prev => ({
        ...prev,
        [projectId]: []
      }));
      return [];
    }
  }, []);

  // 🔥 ОБРАБОТЧИКИ ДЕЙСТВИЙ
  const handleCreateProject = async (projectData) => {
    try {
      await projectsAPI.createProject(projectData);
      await loadAllProjects();
      await loadMyProjects();
      return true;
    } catch (error) {
      showToast.error("Ошибка создания проекта: " + error.message);
      console.error("Ошибка создания проекта:", error);
      throw error;
    }
  };

  const handleAddUserToProject = async (projectId, userId, role) => {
    try {
      await userProjectsAPI.createUserProject({
        userId: userId,
        projectId: projectId,
        role: role
      });
      
      await loadProjectUsers(projectId);
      return true;
    } catch (error) {
      showToast.error("Ошибка добавления пользователя в проект: " + error.message);
      console.error("Ошибка добавления пользователя в проект:", error);
      throw error;
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await projectsAPI.deleteProject(projectId);
      
      if (userRole === 'Admin') {
        await loadAllProjects();
      }
      await loadMyProjects();
      
      return true;
    } catch (error) {
      showToast.error('Ошибка удаления проекта: ' + error.message);
      console.error('Ошибка удаления проекта:', error);
      throw error;
    }
  };

  const handleRemoveUserFromProject = async (projectId, userId) => {
    try {
      await userProjectsAPI.deleteUserProject(userId, projectId);
      await loadProjectUsers(projectId);
      return true;
    } catch (error) {
      console.error("Ошибка удаления пользователя из проекта:", error);
      throw error;
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.updateUserRole(userId, newRole);
      
      setAdminUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      return true;
    } catch (error) {
      console.error("Ошибка изменения роли:", error);
      throw error;
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await usersAPI.deleteUser(userId);
      setAdminUsers(prev => prev.filter(user => user.id !== userId));
      return true;
    } catch (error) {
      console.error("Ошибка удаления пользователя:", error);
      throw error;
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await suppliesAPI.updateSupplyStatus(id, newStatus);
      
      setSupplies(prev =>
        prev.map(supply => {
          if (supply.id === id) {
            return {
              ...supply,
              status: newStatus,
            };
          }
          return supply;
        })
      );

      // Обновляем inspectionSupplies
      if (newStatus.toLowerCase() === "доставлено") {
        const supply = supplies.find(s => s.id === id);
        if (supply && !inspectionSupplies.find(s => s.id === id)) {
          setInspectionSupplies(prev => [...prev, {...supply, status: newStatus}]);
        }
      } else {
        setInspectionSupplies(prev => prev.filter(supply => supply.id !== id));
      }
      showToast.success("Статус успешно обновлен");
      return true;
    } catch (error) {
      showToast.error("Ошибка обновления статуса: " + error.message);
      console.error("Ошибка обновления статуса:", error);
      throw error;
    }
  };

  const handleAddSupply = async (supplyData) => {
    try {
      await suppliesAPI.createSupply(supplyData);
      await loadSupplies();
      showToast.success("Поставка успешно создана");
      return true;
    } catch (error) {
      showToast.error("Ошибка создания поставки: " + error.message);
      console.error("❌ Ошибка создания поставки:", error);
      throw error;
    }
  };

  const handleReportUpload = async (id, files) => {
    try {
      const formData = new FormData();
      
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      await suppliesAPI.uploadDocuments(id, formData);

      setSupplies(prev =>
        prev.map(supply => {
          if (supply.id === id) {
            const currentDocs = supply.documents || [];
            const newDocNames = Array.from(files).map(f => f.name);
            return {
              ...supply,
              documents: [...currentDocs, ...newDocNames]
            };
          }
          return supply;
        })
      );

      // Добавляем в inspectionSupplies если еще нет
      setInspectionSupplies(prev => {
        const alreadyExists = prev.find(s => s.id === id);
        if (!alreadyExists) {
          const supplyToAdd = supplies.find(s => s.id === id);
          if (supplyToAdd) {
            return [...prev, { ...supplyToAdd, status: "доставлено" }];
          }
        }
        return prev;
      });
      showToast.success("Документы успешно загружены");
      return true;
    } catch (error) {
      showToast.error("Ошибка загрузки отчетов: " + error.message);
      console.error("Ошибка загрузки отчетов:", error);
      throw error;
    }
  };

  const handleInspectionApprove = async (id) => {
    try {
      const supply = supplies.find(s => s.id === id);
      
      if (!supply) {
        throw new Error("Поставка не найдена");
      }

      const inspectionData = {
        supplyId: id,
        status: "Одобрено",
        comment: "Поставка соответствует требованиям",
        overdoubt: "DNS-11-A8131-00133.7387",
        reachvalue: "RMS-11-A8131-00133.7387"
      };
      
      await inspectionsAPI.createInspection(inspectionData);
      
      // Добавляем материалы на склад
      for (const material of supply.materials) {
        const warehouseItem = {
          projectId: supply.projectId,
          name: material.name,
          content: material.content || '',
          quantity: material.quantity,
          unit: material.unit || 'шт.',
          category: material.category,
          supplyId: supply.id
        };
        
        await warehouseAPI.createWarehouseItem(warehouseItem);
      }
      
      // Удаляем поставку
      await suppliesAPI.deleteSupply(id);
      
      // Обновляем данные
      await loadSupplies();
      await loadProjectWarehouse(supply.projectId);
      showToast.success("Поставка одобрена и добавлена на склад");

      return true;
    } catch (error) {
      showToast.error("Ошибка одобрения поставки: " + error.message);
      console.error("❌ Ошибка одобрения поставки:", error);
      throw error;
    }
  };

  const handleInspectionReject = async (id, reason) => {
    try {
      const inspectionData = {
        supplyId: id,
        status: "Отклонено",
        comment: reason,
        overdoubt: "DNS-11-A8131-00133.7387",
        reachvalue: "RMS-11-A8131-00133.7387"
      };
      
      await inspectionsAPI.createInspection(inspectionData);
      await suppliesAPI.deleteSupply(id);
      await loadSupplies();
      showToast.success("Поставка отклонена");
      return true;
    } catch (error) {
      showToast.error("Ошибка отклонения поставки: " + error.message);
      console.error("Ошибка отклонения поставки:", error);
      throw error;
    }
  };

  // 🔥 ИНИЦИАЛИЗАЦИЯ
  useEffect(() => {
    // Загружаем данные при изменении пользователя
    const initializeData = async () => {
      if (user) {
        setUserRole(user.role || "Viewer");
        await loadMyProjects();
        
        if (user.role === "Admin") {
          await loadAllProjects();
          await loadAllUsers();
        }
        
        await loadSupplies();
      }
    };
    
    initializeData();
  }, [user, loadMyProjects, loadAllProjects, loadAllUsers, loadSupplies]);

  // 🔥 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  const getAvailableProjects = useCallback(() => {
    if (userRole === "Admin") {
      return projects.length > 0 ? projects : userProjects;
    }
    return userProjects;
  }, [userRole, projects, userProjects]);

  const getProjectName = useCallback((projectId) => {
    const userProject = userProjects.find(p => p.id === projectId);
    if (userProject) return userProject.name;
    
    const allProject = projects.find(p => p.id === projectId);
    if (allProject) return allProject.name;
    
    return `Проект ${projectId}`;
  }, [userProjects, projects]);

  const hasAccessToProject = useCallback((projectId) => {
    if (userRole === "Admin") return true;
    return userProjects.some(project => project.id === projectId);
  }, [userRole, userProjects]);

  const getAvailableSupplies = useCallback((suppliesList) => {
    return suppliesList.filter(supply => hasAccessToProject(supply.projectId));
  }, [hasAccessToProject]);

  // Контекстное значение
  const contextValue = {
    // Состояние
    user,
    setUser,
    userRole,
    
    projects,
    userProjects,
    supplies,
    inspectionSupplies,
    warehouseItems,
    adminUsers,
    projectUsers,
    loading,
    
    // Методы загрузки данных
    loadMyProjects,
    loadAllProjects,
    loadSupplies,
    loadAllUsers,
    loadProjectWarehouse,
    loadProjectUsers,
    
    // Методы действий
    handleCreateProject,
    handleAddUserToProject,
    handleDeleteProject,
    handleRemoveUserFromProject,
    handleRoleChange,
    handleDeleteUser,
    handleStatusChange,
    handleAddSupply,
    handleReportUpload,
    handleInspectionApprove,
    handleInspectionReject,
    
    // Вспомогательные методы
    getAvailableProjects,
    getProjectName,
    hasAccessToProject,
    getAvailableSupplies,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
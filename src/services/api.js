// src/services/api.js
export const API_BASE_URL = "https://thick-ads-tap.loca.lt";

// Получение токена из localStorage
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Функция запроса к API
const makeRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    "bypass-tunnel-reminder": "true", 
    "x-localtunnel-auth": "188.68.80.15",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Для FormData не добавляем Content-Type - браузер сам установит
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    // 🔥 ОСОБАЯ ОБРАБОТКА ДЛЯ 204 (No Content)
    if (response.status === 204) {
      console.log("Response status: 204 - No Content");
      return null;
    }

    const responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response text:", responseText.substring(0, 500));

    let result;
    
    try {
      result = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      if (responseText.startsWith('<!DOCTYPE html>') || responseText.startsWith('<html>')) {
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      } else {
        result = responseText;
      }
    }

    if (!response.ok) {
      throw new Error(result?.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// API для аутентификации
export const authAPI = {
  register: (userData) => 
    makeRequest("/api/Auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (loginData) =>
    makeRequest("/api/Auth/login", {
      method: "POST",
      body: JSON.stringify(loginData),
    }),

  getMe: () => 
    makeRequest("/api/Auth/me"),
};

// API для поставок
export const suppliesAPI = {
  getSupplies: () => makeRequest("/api/Supplies"),
  getSupplyById: (id) => makeRequest(`/api/Supplies/${id}`),
  createSupply: (supplyData) => {
    const formData = new FormData();
    
    // PascalCase основные поля
    formData.append('ProjectId', supplyData.projectId);
    formData.append('SupplyName', supplyData.supplyName);
    formData.append('SupplierName', supplyData.supplierName);
    formData.append('SupplierEmail', supplyData.supplierEmail || '');
    formData.append('DeliveryStatus', supplyData.deliveryStatus || 'создана');
    
    // Materials как массив полей
    supplyData.materials.forEach((material, index) => {
      formData.append(`Materials[${index}].Name`, material.name);
      formData.append(`Materials[${index}].Category`, material.category || '');
      formData.append(`Materials[${index}].Content`, material.content || '');
      formData.append(`Materials[${index}].Quantity`, material.quantity.toString());
    });
    
    formData.append('Documents', JSON.stringify(supplyData.documents || []));

    console.log('📦 FormData для создания поставки:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    return makeRequest("/api/Supplies", {
      method: "POST",
      body: formData,
    });
  },
  
  // 🔥 ИСПРАВЛЕНИЕ: Правильная функция updateSupplyStatus
  updateSupplyStatus: (id, status) =>
    makeRequest(`/api/Supplies/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ deliveryStatus: status }),
    }),
    
  updateSupply: (id, updateData) =>
    makeRequest(`/api/Supplies/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  previewDocument: (supplyId, documentPath) => {
  const token = getAuthToken();
  
  // Обработка пути к документу
  let cleanPath = documentPath;
  if (documentPath.startsWith('/uploads/')) {
    cleanPath = documentPath.substring(9); // Убираем "/uploads/"
  } else if (documentPath.startsWith('uploads/')) {
    cleanPath = documentPath.substring(8); // Убираем "uploads/"
  }
  
  const encodedPath = encodeURIComponent(cleanPath);
  const url = `${API_BASE_URL}/api/Supplies/${supplyId}/documents/${encodedPath}`;
  
  // Добавляем токен в URL для авторизации
  if (token) {
    return `${url}?token=${encodeURIComponent(token)}`;
  }
  return url;
},
    
  deleteSupply: (id) =>
    makeRequest(`/api/Supplies/${id}`, {
      method: "DELETE",
    }),

  // 🔥 ДОБАВЛЕНЫ ФУНКЦИИ ДЛЯ РАБОТЫ С ДОКУМЕНТАМИ
  uploadDocuments: (id, formData) =>
    makeRequest(`/api/Supplies/${id}/documents`, {
      method: "POST",
      body: formData,
    }),

  // 🔥 НОВЫЙ ENDPOINT: Получить документы поставки
  getSupplyDocuments: (id) =>
    makeRequest(`/api/Supplies/${id}/documents`),

  // 🔥 НОВЫЙ ENDPOINT: Скачать конкретный документ
  // В suppliesAPI исправьте функцию downloadDocument:
downloadDocument: (supplyId, documentPath) => {
  const token = getAuthToken();
  
  // Обработка пути к документу
  let cleanPath = documentPath;
  if (documentPath.startsWith('/uploads/')) {
    cleanPath = documentPath.substring(9); // Убираем "/uploads/"
  } else if (documentPath.startsWith('uploads/')) {
    cleanPath = documentPath.substring(8); // Убираем "uploads/"
  }
  
  const encodedPath = encodeURIComponent(cleanPath);
  const fullUrl = `${API_BASE_URL}/api/Supplies/${supplyId}/documents/${encodedPath}`;
  
  console.log('Download URL:', fullUrl);
  
  return fetch(fullUrl, {
    method: "GET",
    headers: {
      "Authorization": token ? `Bearer ${token}` : "",
      "bypass-tunnel-reminder": "true", 
      "x-localtunnel-auth": "188.68.80.15",
    }
  });
},

  // 🔥 НОВЫЙ ENDPOINT: Удалить документ
  deleteDocument: (supplyId, documentName) =>
    makeRequest(`/api/Supplies/${supplyId}/documents/${documentName}`, {
      method: "DELETE",
    }),

  // 🔥 НОВЫЙ ENDPOINT: Проверить доступность документа
  checkDocumentAccess: (supplyId, documentPath) => {
    const url = `${API_BASE_URL}/api/Supplies/${supplyId}/documents/${encodeURIComponent(documentPath)}`;
    
    return fetch(url, { 
      method: "HEAD",
      headers: {
        "bypass-tunnel-reminder": "true", 
        "x-localtunnel-auth": "188.68.80.15",
      }
    }).then(response => response.ok);
  },
};
// API для проектов
// В секции projectsAPI в файле api.js добавьте:
export const projectsAPI = {
  getProjects: () => makeRequest("/api/Projects"),
  getMyProjects: () => makeRequest("/api/Projects/my"),
  createProject: (projectData) =>
    makeRequest("/api/Projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    }),
  getProjectById: (id) => makeRequest(`/api/Projects/${id}`),
  deleteProject: (id) =>
    makeRequest(`/api/Projects/${id}`, {
      method: "DELETE",
    }),
  addUserToProject: (projectId, userData) =>
    makeRequest(`/api/Projects/${projectId}/users`, {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  getProjectUsers: (projectId) => 
    makeRequest(`/api/Projects/${projectId}/users`),
};

// API для проверок (inspections)
export const inspectionsAPI = {
  getInspections: () => makeRequest("/api/Inspections"),
  createInspection: (inspectionData) =>
    makeRequest("/api/Inspections", {
      method: "POST",
      body: JSON.stringify(inspectionData),
    }),
  getInspectionBySupplyId: (supplyId) => 
    makeRequest(`/api/Inspections/supply/${supplyId}`),
  updateInspection: (id, updateData) =>
    makeRequest(`/api/Inspections/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),
  deleteInspection: (id) =>
    makeRequest(`/api/Inspections/${id}`, {
      method: "DELETE",
    }),
};

// API для пользователей
export const usersAPI = {
  getUsers: () => makeRequest("/api/Users"),
  getUserById: (id) => makeRequest(`/api/Users/${id}`),
  updateUserRole: (id, role) => 
    makeRequest(`/api/Users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),
  deleteUser: (id) =>
    makeRequest(`/api/Users/${id}`, {
      method: "DELETE",
    }),
};


// API для этапов работ
export const workStagesAPI = {
  getWorkStages: () => makeRequest("/api/WorkStages"),
  createWorkStage: (workStageData) =>
    makeRequest("/api/WorkStages", {
      method: "POST",
      body: JSON.stringify(workStageData),
    }),
  getWorkStagesByProject: (projectId) => 
    makeRequest(`/api/WorkStages/project/${projectId}`),
};

// API для приглашений
export const invitationsAPI = {
  createInvitation: (invitationData) =>
    makeRequest("/api/Invitations/create", {
      method: "POST",
      body: JSON.stringify(invitationData),
    }),
  validateInvitation: () => 
    makeRequest("/api/Invitations/validate"),
  acceptInvitation: (acceptData) =>
    makeRequest("/api/Invitations/accept", {
      method: "POST",
      body: JSON.stringify(acceptData),
    }),
};

// API для связи пользователей с проектами
export const userProjectsAPI = {
  createUserProject: (userProjectData) =>
    makeRequest("/api/UserProjects", {
      method: "POST",
      body: JSON.stringify(userProjectData),
    }),
  getProjectUsers: (projectId) => 
    makeRequest(`/api/Projects/${projectId}/users`),
  deleteUserProject: (userId, projectId) =>
    makeRequest(`/api/UserProjects/${userId}/${projectId}`, {
      method: "DELETE",
    }),
};


// В api.js - ПОЛНАЯ РЕАЛИЗАЦИЯ writeOffAPI

// API для списания материалов (ПОЛНАЯ РЕАЛИЗАЦИЯ)
// API для списания материалов (ПОЛНАЯ РЕАЛИЗАЦИЯ - БЕЗ ИЗМЕНЕНИЙ warehouseAPI)
// API для списания материалов - РЕАЛИЗАЦИЯ ДЛЯ ВАШЕГО БЭКЕНДА
export const writeOffAPI = {
  // 🔥 СОЗДАНИЕ СПИСАНИЯ
  createWriteOff: (writeOffData) => {
    console.log('📝 Создание списания:', writeOffData);
    
    return makeRequest("/api/WarehouseWriteOff", {
      method: "POST",
      body: JSON.stringify(writeOffData),
    });
  },

  // 🔥 ПОЛУЧИТЬ СПИСАНИЕ ПО ID
  getWriteOffById: (id) => 
    makeRequest(`/api/WarehouseWriteOff/${id}`),

  // 🔥 УДАЛИТЬ СПИСАНИЕ
  deleteWriteOff: (id) => 
    makeRequest(`/api/WarehouseWriteOff/${id}`, {
      method: "DELETE",
    }),

  // 🔥 ПОЛУЧИТЬ СПИСАНИЯ ОЖИДАЮЩИЕ ПРОВЕРКИ
  getPendingWriteOffs: () => 
    makeRequest("/api/WarehouseWriteOff/pending"),

  // 🔥 ПОЛУЧИТЬ ОДОБРЕННЫЕ СПИСАНИЯ
  getApprovedWriteOffs: () => 
    makeRequest("/api/WarehouseWriteOff/approved"),

  // 🔥 ПОЛУЧИТЬ ОТКЛОНЕННЫЕ СПИСАНИЯ
  getRejectedWriteOffs: () => 
    makeRequest("/api/WarehouseWriteOff/rejected"),

  // 🔥 ОДОБРИТЬ СПИСАНИЕ
  approveWriteOff: (id, approvalData = {}) => {
    console.log(`✅ Одобрение списания ${id}`);
    
    return makeRequest(`/api/WarehouseWriteOff/${id}/approve`, {
      method: "PUT",
    });
  },

  // 🔥 ОТКЛОНИТЬ СПИСАНИЕ
   rejectWriteOff: (id, rejectionData = {}) => {
    console.log(`❌ Отклонение списания ${id} с причиной:`, rejectionData.reason);
    
    // Если бэкенд требует тело запроса даже при пустой причине
    const requestBody = JSON.stringify({
      reason: rejectionData.reason || 'Причина не указана'
    });
    
    return makeRequest(`/api/WarehouseWriteOff/${id}/reject`, {
      method: "PUT",
      body: requestBody,
    });
  },
  // 🔥 ПОЛУЧИТЬ СПИСАНИЯ ПО МАТЕРИАЛУ
  getWriteOffsByItem: (warehouseItemId) => 
    makeRequest(`/api/WarehouseWriteOff/item/${warehouseItemId}`),

  // 🔥 УПРАВЛЕНИЕ ОДОБРЕНИЕМ/ОТКЛОНЕНИЕМ
  processWriteOffApproval: async (writeOffId, action, reason = '') => {
    try {
      if (action === 'approve') {
        await writeOffAPI.approveWriteOff(writeOffId);
      } else if (action === 'reject') {
        await writeOffAPI.rejectWriteOff(writeOffId);
      } else {
        throw new Error('Неизвестное действие: ' + action);
      }
      
      return { 
        success: true, 
        message: `Списание ${action === 'approve' ? 'одобрено' : 'отклонено'}` 
      };
    } catch (error) {
      console.error(`Ошибка ${action} списания:`, error);
      throw error;
    }
  },

  // 🔥 ПОЛУЧИТЬ ВСЕ СПИСАНИЯ (только через эндпоинты pending/approved/rejected)
  getAllWriteOffs: async () => {
    try {
      // Получаем списания из всех категорий
      const [pending, approved, rejected] = await Promise.all([
        writeOffAPI.getPendingWriteOffs(),
        writeOffAPI.getApprovedWriteOffs(),
        writeOffAPI.getRejectedWriteOffs()
      ]);
      
      // Объединяем все списания
      const allWriteOffs = [
        ...(pending || []).map(w => ({ ...w, status: 'pending' })),
        ...(approved || []).map(w => ({ ...w, status: 'approved' })),
        ...(rejected || []).map(w => ({ ...w, status: 'rejected' }))
      ];
      
      return allWriteOffs;
    } catch (error) {
      console.error('Ошибка получения всех списаний:', error);
      return [];
    }
  },

  // 🔥 ПОЛУЧИТЬ СПИСАНИЯ ПО ПРОЕКТУ
  getWriteOffsByProject: async (projectId) => {
    try {
      // Получаем все списания
      const allWriteOffs = await writeOffAPI.getAllWriteOffs();
      
      // Фильтруем по projectId
      const projectWriteOffs = allWriteOffs.filter(writeOff => {
        return writeOff.projectId?.toString() === projectId?.toString();
      });
      
      console.log(`📊 Найдено ${projectWriteOffs.length} списаний для проекта ${projectId}`);
      return projectWriteOffs;
    } catch (error) {
      console.error('Ошибка загрузки списаний по проекту:', error);
      return [];
    }
  }
};
// API для склада
// В файле api.js добавьте в warehouseAPI:
// В файле api.js в warehouseAPI исправьте:
export const warehouseAPI = {
  getWarehouseByProject: (projectId) => 
    makeRequest(`/api/Warehouse/project/${projectId}`),
  
  createWarehouseItem: (itemData) => {
    // Преобразуем поля в правильный формат (PascalCase для бэкенда)
    const formattedData = {
      ProjectId: itemData.projectId,
      Name: itemData.name,
      Content: itemData.content || '',
      Quantity: itemData.quantity,
      Unit: itemData.unit || 'шт.',
      Category: itemData.category,
      SupplyId: itemData.supplyId
    };
    
    console.log('📦 Отправляем на склад:', formattedData);
    
    return makeRequest("/api/Warehouse", {
      method: "POST",
      body: JSON.stringify(formattedData),
    });
  },
  
  updateWarehouseItem: (id, updateData) => {
    const formattedData = {
      Name: updateData.name,
      Content: updateData.content,
      Quantity: updateData.quantity,
      Unit: updateData.unit,
      Category: updateData.category
    };
    
    return makeRequest(`/api/Warehouse/${id}`, {
      method: "PUT",
      body: JSON.stringify(formattedData),
    });
  },
  
  deleteWarehouseItem: (id) =>
    makeRequest(`/api/Warehouse/${id}`, {
      method: "DELETE",
    }),
  
  getWarehouseItems: () => makeRequest("/api/Warehouse"),
};

// src/components/WriteOffTable.js - ПОЛНАЯ ВЕРСИЯ С CONTEXT
import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../services/AppContext";
import "./WriteOffTable.css";
import { showToast } from '../utils/toast';
import { writeOffAPI, warehouseAPI } from "../services/api";

export default function WriteOffTable({ 
  projectId,
  loading,
  userRole,
  onWriteOffSuccess,
  showEmptyMessage = false
}) {
  const { loadProjectWarehouse } = useAppContext();
  
  const [writeOffs, setWriteOffs] = useState([]);
  const [warehouseItems, setWarehouseItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvedWriteOffs, setApprovedWriteOffs] = useState([]);
  const [rejectedWriteOffs, setRejectedWriteOffs] = useState([]);
  const [activeTab, setActiveTab] = useState("create");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchColumn, setSearchColumn] = useState("all");

  // Состояние формы списания
  const [writeOffForm, setWriteOffForm] = useState({
    warehouseItemId: "",
    quantity: "",
    content: "",
    reason: "Списание на строительные работы"
  });

  // Загрузка данных при изменении проекта
  useEffect(() => {
    if (projectId) {
      loadAllData();
    }
  }, [projectId]);

  // Загрузка всех данных
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Загружаем материалы со склада проекта
      const warehouseData = await warehouseAPI.getWarehouseByProject(projectId);
      setWarehouseItems(warehouseData || []);
      
      // 2. Загружаем все списания проекта
      const projectWriteOffs = await writeOffAPI.getWriteOffsByProject(projectId);
      setWriteOffs(projectWriteOffs);
      
      // 3. Разделяем по статусам
      const pending = projectWriteOffs.filter(w => w.status === 'pending');
      const approved = projectWriteOffs.filter(w => w.status === 'approved');
      const rejected = projectWriteOffs.filter(w => w.status === 'rejected');
      
      setPendingApprovals(pending);
      setApprovedWriteOffs(approved);
      setRejectedWriteOffs(rejected);
      
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      showToast.error("Ошибка загрузки данных списания");
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка материалов со склада
  const loadWarehouseItems = async () => {
    try {
      const data = await warehouseAPI.getWarehouseByProject(projectId);
      setWarehouseItems(data || []);
    } catch (error) {
      console.error("Ошибка загрузки материалов:", error);
      showToast.error("Ошибка загрузки материалов");
      setWarehouseItems([]);
    }
  };

  const getMaterialInfo = (writeOff) => {
  // Приоритет 1: явные данные в writeOff
  if (writeOff.materialName) {
    return {
      name: writeOff.materialName,
      category: writeOff.materialCategory || writeOff.category || "—",
      quantity: writeOff.quantity || 0,
      unit: writeOff.materialUnit || writeOff.unit || "шт."
    };
  }
  
  // Приоритет 2: данные из warehouseItem
  if (writeOff.warehouseItem) {
    return {
      name: writeOff.warehouseItem.name || "Материал",
      category: writeOff.warehouseItem.category || "—",
      quantity: writeOff.warehouseItem.quantity || 0,
      unit: writeOff.warehouseItem.unit || "шт."
    };
  }
  
  // Приоритет 3: парсинг из content
  if (writeOff.content) {
    // Пытаемся извлечь из строки типа "Списание материала: Цемент..."
    let name = "Материал";
    let category = "—";
    
    const nameMatch = writeOff.content.match(/материала:\s*([^(]+)/i) || 
                     writeOff.content.match(/материал:\s*([^(]+)/i);
    const categoryMatch = writeOff.content.match(/категория:\s*([^.,]+)/i);
    
    if (nameMatch) name = nameMatch[1].trim();
    if (categoryMatch) category = categoryMatch[1].trim();
    
    return {
      name: name,
      category: category,
      quantity: writeOff.quantity || 0,
      unit: "шт."
    };
  }
  
  // Резервные данные
  return {
    name: "Материал",
    category: "—",
    quantity: writeOff.quantity || 0,
    unit: "шт."
  };
};

  // 🔥 ФИЛЬТРАЦИЯ ДАННЫХ
  const filteredWriteOffs = useMemo(() => {
    if (!searchTerm.trim()) return writeOffs;
    
    const term = searchTerm.toLowerCase().trim();
    
    return writeOffs.filter(item => {
      switch (searchColumn) {
        case 'material':
          return item.warehouseItem?.name?.toLowerCase().includes(term);
        
        case 'category':
          return item.warehouseItem?.category?.toLowerCase().includes(term);
        
        case 'reason':
          return item.reason?.toLowerCase().includes(term) || 
                 item.content?.toLowerCase().includes(term);
        
        case 'status':
          return item.status?.toLowerCase().includes(term);
        
        case 'all':
        default:
          return (
            item.warehouseItem?.name?.toLowerCase().includes(term) ||
            item.warehouseItem?.category?.toLowerCase().includes(term) ||
            item.reason?.toLowerCase().includes(term) ||
            item.content?.toLowerCase().includes(term) ||
            item.status?.toLowerCase().includes(term)
          );
      }
    });
  }, [writeOffs, searchTerm, searchColumn]);

  // Обработчик изменения формы
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setWriteOffForm(prev => ({ ...prev, [name]: value }));
    
    if (name === "warehouseItemId") {
      const item = warehouseItems.find(i => i.id === value);
      setSelectedWarehouseItem(item);
      // Автоматически заполняем content
      if (item) {
        setWriteOffForm(prev => ({
          ...prev,
          content: `Списание материала: ${item.name}. Категория: ${item.category}`
        }));
      }
    }
  };

  // 🔥 СОЗДАНИЕ СПИСАНИЯ
  const handleCreateWriteOff = async (e) => {
    e.preventDefault();
     const selectedItem = warehouseItems.find(i => i.id === writeOffForm.warehouseItemId);
    const quantity = parseFloat(writeOffForm.quantity);
    if (!writeOffForm.warehouseItemId || !writeOffForm.quantity) {
  showToast.warning("Заполните обязательные поля: материал и количество");
  return;
}

if (!selectedItem) {
  showToast.warning("Материал не найден");
  return;
}

if (quantity <= 0) {
  showToast.warning("Количество должно быть больше 0");
  return;
}

if (quantity > selectedItem.quantity) {
  showToast.warning(`Недостаточно материалов на складе. Доступно: ${selectedItem.quantity}`);
  return;
}

    try {
      setIsLoading(true);
      
      // Создаем запись о списании
      const writeOffData = {
        warehouseItemId: writeOffForm.warehouseItemId,
        projectId: projectId,
        quantity: quantity,
        content: writeOffForm.content || `Списание: ${selectedItem.name}. Причина: ${writeOffForm.reason}`,
        reason: writeOffForm.reason
      };

      console.log('📝 Отправляем списание:', writeOffData);
      await writeOffAPI.createWriteOff(writeOffData);
      
      // Обновляем все данные
      await loadAllData();
      
      // Сбрасываем форму
      setWriteOffForm({
        warehouseItemId: "",
        quantity: "",
        content: "",
        reason: "Списание на строительные работы"
      });
      setShowForm(false);
      setSelectedWarehouseItem(null);
      
      if (onWriteOffSuccess) {
        onWriteOffSuccess();
      } else {
        // Используем context если onWriteOffSuccess не передан
        await loadProjectWarehouse(projectId);
      }
      
      showToast.success("Списание создано и отправлено на проверку!");
      
    } catch (error) {
      console.error("Ошибка создания списания:", error);
      showToast.error("Не удалось создать списание: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 ОДОБРЕНИЕ СПИСАНИЯ
  const handleApproveWriteOff = async (writeOffId) => {
    if (!window.confirm("Одобрить это списание?")) return;
    
    try {
      setIsLoading(true);
      
      // 1. Одобряем списание
      await writeOffAPI.approveWriteOff(writeOffId);
      
      // 2. Обновляем количество на складе
      const writeOff = writeOffs.find(w => w.id === writeOffId);
      if (writeOff && writeOff.warehouseItemId) {
        // Находим материал
        const warehouseItem = warehouseItems.find(item => item.id === writeOff.warehouseItemId);
        if (warehouseItem) {
          const newQuantity = Math.max(0, warehouseItem.quantity - writeOff.quantity);
          await warehouseAPI.updateWarehouseItem(warehouseItem.id, {
            name: warehouseItem.name,
            content: warehouseItem.content,
            quantity: newQuantity,
            unit: warehouseItem.unit,
            category: warehouseItem.category
          });
        }
      }
      
      // 3. Перезагружаем данные
      await loadAllData();
      
      // 4. Обновляем склад через context
      await loadProjectWarehouse(projectId);
      showToast.success("Списание одобрено и количество вычтено со склада!");

      
      
    } catch (error) {
      console.error("Ошибка одобрения списания:", error);
      showToast.error("Не удалось одобрить списание: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 ОТКЛОНЕНИЕ СПИСАНИЯ
  const handleRejectWriteOff = async (writeOffId) => {
    const reason = prompt("Укажите причину отклонения:");
    if (!reason || reason.trim() === "") return;
    
    try {
      setIsLoading(true);
      
      await writeOffAPI.rejectWriteOff(writeOffId, reason);
      
      // Обновляем данные
      await loadAllData();
       showToast.success("❌ Списание отклонено!");
      
    } catch (error) {
      console.error("Ошибка отклонения списания:", error);
      showToast.error("Не удалось отклонить списание: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 УДАЛЕНИЕ СПИСАНИЯ
  const handleDeleteWriteOff = async (writeOffId) => {
    if (!window.confirm("Удалить запись о списании?")) return;
    
    try {
      setIsLoading(true);
      await writeOffAPI.deleteWriteOff(writeOffId);
      await loadAllData();
      showToast.success("🗑️ Списание удалено!");
    } catch (error) {
      console.error("Ошибка удаления списания:", error);
      showToast.error("Не удалось удалить списание: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция подстветки текста
  const highlightText = (text) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.toString().split(regex);
    
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <mark key={index} className="highlight">{part}</mark> 
        : part
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU").slice(0, 5);
    } catch {
      return "—";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge pending">⏳ Ожидает</span>;
      case 'approved':
        return <span className="status-badge approved">✅ Одобрено</span>;
      case 'rejected':
        return <span className="status-badge rejected">❌ Отклонено</span>;
      default:
        return <span className="status-badge unknown">❓ Неизвестно</span>;
    }
  };

  const canApproveReject = ["Admin", "Manager", "Inspector"].includes(userRole);

  if (isLoading) {
    return (
      <div className="writeoff-table-wrapper">
        <div className="loading">Загрузка данных списания...</div>
      </div>
    );
  }

  return (
    <div className="writeoff-table-wrapper">
      {/* ВКЛАДКИ */}
      <div className="writeoff-tabs">
        <button 
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          📝 Новое списание
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ На проверку ({pendingApprovals.length})
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 Все списания ({writeOffs.length})
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          ✅ Одобренные ({approvedWriteOffs.length})
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          ❌ Отклоненные ({rejectedWriteOffs.length})
        </button>
      </div>

      {/* ПАНЕЛЬ ПОИСКА (для вкладок с данными) */}
      {(activeTab === 'history' || activeTab === 'approved' || activeTab === 'rejected') && (
        <div className="search-panel writeoff-search">
          <div className="search-controls">
            <div className="search-input-group">
              <span className="search-icon"></span>
              <input
                type="text"
                placeholder="Поиск по списаниям..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                disabled={isLoading}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="clear-search-btn" title="Очистить поиск">
                  ✕
                </button>
              )}
            </div>
            
            <select
              value={searchColumn}
              onChange={(e) => setSearchColumn(e.target.value)}
              className="search-column-select"
              disabled={isLoading}
            >
              <option value="all">Везде</option>
              <option value="material">Материал</option>
              <option value="category">Категория</option>
              <option value="reason">Причина</option>
              <option value="status">Статус</option>
            </select>
            
            <div className="search-info">
              <span className="search-count">
                Найдено: <strong>{filteredWriteOffs.length}</strong> записей
              </span>
            </div>
          </div>
        </div>
      )}

      {/* КОНТЕНТ ВКЛАДОК */}
      <div className="writeoff-content">
        {/* ВКЛАДКА: СОЗДАНИЕ СПИСАНИЯ */}
        {activeTab === 'create' && (
          <div className="writeoff-create-tab">
            <div className="writeoff-header">
              <h4>Создать новое списание</h4>
              {warehouseItems.length === 0 ? (
                <p className="warning-text">На складе нет материалов для списания</p>
              ) : (
                <button 
                  onClick={() => setShowForm(!showForm)}
                  className="toggle-form-btn"
                >
                  {showForm ? '✕ Отменить' : '+ Создать списание'}
                </button>
              )}
            </div>

            {/* ФОРМА СПИСАНИЯ */}
            {showForm && (
              <div className="writeoff-form-container">
                <form onSubmit={handleCreateWriteOff}>
                  <div className="form-group">
                    <label>Материал со склада:</label>
                    <select
                      name="warehouseItemId"
                      value={writeOffForm.warehouseItemId}
                      onChange={handleFormChange}
                      required
                      className="form-select"
                    >
                      <option value="">Выберите материал</option>
                      {warehouseItems
                        .filter(item => item.quantity > 0)
                        .map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} (Категория: {item.category}) - Доступно: {item.quantity} {item.unit}
                          </option>
                        ))}
                    </select>
                  </div>

                  {selectedWarehouseItem && (
                    <div className="item-info">
                      <p><strong>Выбранный материал:</strong> {selectedWarehouseItem.name}</p>
                      <p><strong>Категория:</strong> {selectedWarehouseItem.category}</p>
                      <p><strong>Доступно на складе:</strong> {selectedWarehouseItem.quantity} {selectedWarehouseItem.unit}</p>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Количество для списания:</label>
                    <input
                      type="number"
                      name="quantity"
                      value={writeOffForm.quantity}
                      onChange={handleFormChange}
                      min="0.01"
                      step="0.01"
                      max={selectedWarehouseItem?.quantity || 0}
                      required
                      className="form-input"
                      placeholder="Введите количество"
                    />
                    {selectedWarehouseItem && (
                      <small>Максимум: {selectedWarehouseItem.quantity} {selectedWarehouseItem.unit}</small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Причина списания:</label>
                    <select
                      name="reason"
                      value={writeOffForm.reason}
                      onChange={handleFormChange}
                      className="form-select"
                    >
                      <option value="Списание на строительные работы">Строительные работы</option>
                      <option value="Списание на ремонтные работы">Ремонтные работы</option>
                      <option value="Списание на монтажные работы">Монтажные работы</option>
                      <option value="Списание на отделочные работы">Отделочные работы</option>
                      <option value="Технологические потери">Технологические потери</option>
                      <option value="Брак">Брак</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Комментарий:</label>
                    <textarea
                      name="content"
                      value={writeOffForm.content}
                      onChange={handleFormChange}
                      className="form-textarea"
                      placeholder="Дополнительные сведения о списании"
                      rows="3"
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Создание...' : '📤 Отправить на проверку'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)}
                      className="cancel-btn"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showForm && warehouseItems.length > 0 && (
              <div className="writeoff-instructions">
                <p><strong>Процесс списания:</strong></p>
                <ol>
                  <li>Выберите материал со склада</li>
                  <li>Укажите количество и причину списания</li>
                  <li>Списание будет отправлено на проверку менеджеру</li>
                  <li>После одобрения количество автоматически спишется со склада</li>
                  <li>Вы можете отслеживать статус во вкладках выше</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА: СПИСАНИЯ НА ПРОВЕРКУ */}
        {activeTab === 'pending' && (
          <div className="writeoff-pending-tab">
            <div className="writeoff-header">
              <h4>Списания ожидающие проверки</h4>
              <button 
                onClick={loadAllData}
                className="refresh-btn"
                disabled={isLoading}
              >
                🔄 Обновить
              </button>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="empty-state">
                <p>Нет списаний ожидающих проверки</p>
              </div>
            ) : (
              <>
                <table className="writeoff-table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Материал</th>
                      <th>Количество</th>
                      <th>Причина</th>
                      <th>Дата создания</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map((writeOff, index) => (
                      <tr key={writeOff.id || index}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{getMaterialInfo(writeOff).name}</strong>
                          <br />
                          <small>Категория: {getMaterialInfo(writeOff).category}</small>
                        </td>
                        <td>
                          {writeOff.quantity} {writeOff.warehouseItem?.unit || "шт."}
                        </td>
                        <td>
                          {writeOff.reason || writeOff.content || "—"}
                          {writeOff.warehouseItem && (
                            <br />
                          )}
                          <small>На складе: {writeOff.warehouseItem?.quantity || 0}</small>
                        </td>
                        <td>{formatDate(writeOff.createdAt)}</td>
                        <td>{getStatusBadge(writeOff.status)}</td>
                        <td className="action-buttons">
                          {canApproveReject && (
                            <>
                              <button 
                                onClick={() => handleApproveWriteOff(writeOff.id)}
                                className="action-btn approve-btn"
                                title="Одобрить списание"
                              >
                                ✅
                              </button>
                              <button 
                                onClick={() => handleRejectWriteOff(writeOff.id)}
                                className="action-btn reject-btn"
                                title="Отклонить списание"
                              >
                                ❌
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleDeleteWriteOff(writeOff.id)}
                            className="action-btn delete-btn"
                            title="Удалить списание"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="writeoff-summary">
                  <p><strong>Ожидает проверки:</strong> {pendingApprovals.length} списаний</p>
                  <p><strong>Общее количество:</strong> 
                    {pendingApprovals.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)} единиц
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ВКЛАДКА: ВСЕ СПИСАНИЯ */}
        {activeTab === 'history' && (
          <div className="writeoff-history-tab">
            <div className="writeoff-header">
              <h4>История всех списаний</h4>
              <button 
                onClick={loadAllData}
                className="refresh-btn"
                disabled={isLoading}
              >
                🔄 Обновить
              </button>
            </div>

            {filteredWriteOffs.length === 0 ? (
              <div className="empty-state">
                <p>Нет истории списаний</p>
              </div>
            ) : (
              <>
                <table className="writeoff-table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Материал</th>
                      <th>Количество</th>
                      <th>Причина</th>
                      <th>Статус</th>
                      <th>Дата</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWriteOffs.map((writeOff, index) => (
                      <tr key={writeOff.id || index}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{highlightText(getMaterialInfo(writeOff).name)}</strong>
                          <br />
                          <small>Категория: {highlightText(getMaterialInfo(writeOff).category)}</small>
                        </td>
                        <td>
                          {highlightText(writeOff.quantity.toString())} {writeOff.warehouseItem?.unit || "шт."}
                        </td>
                        <td>
                          {highlightText(writeOff.reason || writeOff.content || "—")}
                        </td>
                        <td>{getStatusBadge(writeOff.status)}</td>
                        <td>{formatDate(writeOff.createdAt)}</td>
                        <td className="action-buttons">
                          {writeOff.status === 'pending' && canApproveReject && (
                            <>
                              <button 
                                onClick={() => handleApproveWriteOff(writeOff.id)}
                                className="action-btn approve-btn"
                                title="Одобрить"
                              >
                                ✅
                              </button>
                              <button 
                                onClick={() => handleRejectWriteOff(writeOff.id)}
                                className="action-btn reject-btn"
                                title="Отклонить"
                              >
                                ❌
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleDeleteWriteOff(writeOff.id)}
                            className="action-btn delete-btn"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="writeoff-summary">
                  <p><strong>Всего списаний:</strong> {writeOffs.length} записей</p>
                  <p><strong>Общее количество списано:</strong> 
                    {writeOffs.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)} единиц
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ВКЛАДКА: ОДОБРЕННЫЕ СПИСАНИЯ */}
        {activeTab === 'approved' && (
          <div className="writeoff-approved-tab">
            <div className="writeoff-header">
              <h4>Одобренные списания</h4>
              <button 
                onClick={loadAllData}
                className="refresh-btn"
                disabled={isLoading}
              >
                🔄 Обновить
              </button>
            </div>

            {approvedWriteOffs.length === 0 ? (
              <div className="empty-state">
                <p>Нет одобренных списаний</p>
              </div>
            ) : (
              <>
                <table className="writeoff-table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Материал</th>
                      <th>Количество</th>
                      <th>Причина</th>
                      <th>Дата одобрения</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedWriteOffs.map((writeOff, index) => (
                      <tr key={writeOff.id || index}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{writeOff.warehouseItem?.name || "Материал"}</strong>
                          <br />
                          <small>Категория: {writeOff.warehouseItem?.category || "—"}</small>
                        </td>
                        <td>
                          {writeOff.quantity} {writeOff.warehouseItem?.unit || "шт."}
                        </td>
                        <td>
                          {writeOff.reason || writeOff.content || "—"}
                        </td>
                        <td>{formatDate(writeOff.updatedAt || writeOff.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="writeoff-summary">
                  <p><strong>Одобрено:</strong> {approvedWriteOffs.length} списаний</p>
                  <p><strong>Количество одобрено:</strong> 
                    {approvedWriteOffs.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)} единиц
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ВКЛАДКА: ОТКЛОНЕННЫЕ СПИСАНИЯ */}
        {activeTab === 'rejected' && (
          <div className="writeoff-rejected-tab">
            <div className="writeoff-header">
              <h4>Отклоненные списания</h4>
              <button 
                onClick={loadAllData}
                className="refresh-btn"
                disabled={isLoading}
              >
                🔄 Обновить
              </button>
            </div>

            {rejectedWriteOffs.length === 0 ? (
              <div className="empty-state">
                <p>Нет отклоненных списаний</p>
              </div>
            ) : (
              <>
                <table className="writeoff-table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Материал</th>
                      <th>Количество</th>
                      <th>Причина</th>
                      <th>Дата отклонения</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedWriteOffs.map((writeOff, index) => (
                      <tr key={writeOff.id || index}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{writeOff.warehouseItem?.name || "Материал"}</strong>
                          <br />
                          <small>Категория: {writeOff.warehouseItem?.category || "—"}</small>
                        </td>
                        <td>
                          {writeOff.quantity} {writeOff.warehouseItem?.unit || "шт."}
                        </td>
                        <td>
                          {writeOff.reason || writeOff.content || "—"}
                        </td>
                        <td>{formatDate(writeOff.updatedAt || writeOff.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="writeoff-summary">
                  <p><strong>Отклонено:</strong> {rejectedWriteOffs.length} списаний</p>
                  <p><strong>Количество отклонено:</strong> 
                    {rejectedWriteOffs.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)} единиц
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
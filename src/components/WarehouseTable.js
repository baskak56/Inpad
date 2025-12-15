// src/components/WarehouseTable.js
import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../services/AppContext";
import "./WarehouseTable.css";

export default function WarehouseTable({ 
  warehouseItems = [], 
  loading,
  projectId,
  onRefresh
}) {
  const { loadProjectWarehouse } = useAppContext();
  
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchColumn, setSearchColumn] = useState("all");

  useEffect(() => {
    const loadWarehouseItems = async () => {
      if (!projectId) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await loadProjectWarehouse(projectId);
        setItems(data || []);
      } catch (error) {
        console.error("Ошибка загрузки данных склада:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWarehouseItems();
  }, [projectId, loadProjectWarehouse]);

  // 🔥 ФИЛЬТРАЦИЯ ДАННЫХ СКЛАДА
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase().trim();
    
    return items.filter(item => {
      switch (searchColumn) {
        case 'name':
          return item.name?.toLowerCase().includes(term);
        
        case 'category':
          return item.category?.toLowerCase().includes(term);
        
        case 'content':
          return item.content?.toLowerCase().includes(term);
        
        case 'supplyId':
          return item.supplyId?.toLowerCase().includes(term);
        
        case 'quantity':
          return item.quantity?.toString().includes(term);
        
        case 'all':
        default:
          return (
            item.name?.toLowerCase().includes(term) ||
            item.category?.toLowerCase().includes(term) ||
            item.content?.toLowerCase().includes(term) ||
            item.supplyId?.toLowerCase().includes(term) ||
            item.quantity?.toString().includes(term)
          );
      }
    });
  }, [items, searchTerm, searchColumn]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU");
    } catch {
      return "—";
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    } else if (projectId) {
      try {
        setIsLoading(true);
        const data = await loadProjectWarehouse(projectId);
        setItems(data || []);
      } catch (error) {
        console.error("Ошибка обновления склада:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 🔥 ФУНКЦИЯ СУММИРОВАНИЯ КОЛИЧЕСТВА
  const getTotalQuantity = (itemsArray) => {
    return itemsArray.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  };

  // 🔥 ФУНКЦИЯ ПОДСВЕТКИ
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

  if (isLoading) {
    return (
      <div className="warehouse-table-wrapper">
        <div className="loading">Загрузка данных склада...</div>
      </div>
    );
  }

  return (
    <div className="warehouse-table-wrapper">
      <div className="warehouse-header">
        <div className="warehouse-title">
          <h3>Склад проекта</h3>
          <button 
            onClick={handleRefresh}
            className="refresh-btn"
            title="Обновить данные склада"
            disabled={loading || isLoading}
          >
            🔄 Обновить
          </button>
        </div>
        <div className="warehouse-stats">
          <span>Материалы: <strong>{filteredItems.length}</strong> из {items.length}</span>
          <span>Количество: <strong>{getTotalQuantity(filteredItems)}</strong></span>
        </div>
      </div>
      
      {/* 🔥 ПАНЕЛЬ ПОИСКА СКЛАДА */}
      <div className="search-panel warehouse-search">
        <div className="search-controls">
          <div className="search-input-group">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="Поиск на складе..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              disabled={loading || isLoading}
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
            disabled={loading || isLoading}
          >
            <option value="all">Везде</option>
            <option value="name">Наименование</option>
            <option value="category">Категория</option>
            <option value="content">Содержимое</option>
            <option value="supplyId">ID поставки</option>
            <option value="quantity">Количество</option>
          </select>
          
          <div className="search-info">
            <span className="search-count">
              Найдено: <strong>{filteredItems.length}</strong> позиций
            </span>
          </div>
        </div>
      </div>
      
      <table className="warehouse-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Наименование (Категория)</th>
            <th>Содержимое (Материал)</th>
            <th>Количество</th>
            <th>Ед. изм.</th>
            <th>Категория</th>
            <th>ID поставки</th>
            <th>Дата поступления</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-table">
                {searchTerm 
                  ? "По вашему запросу ничего не найдено" 
                  : "На складе нет материалов"}
              </td>
            </tr>
          ) : (
            filteredItems.map((item, index) => (
              <tr key={item.id || index}>
                <td>{index + 1}</td>
                
                <td className="item-name">
                  <strong title={item.category || "—"}>
                    {highlightText(item.category || "—")}
                  </strong>
                </td>
                
                <td className="item-content">
                  <span title={item.name || "—"}>
                    {highlightText(item.name || "—")}
                  </span>
                </td>
                
                <td className="quantity">
                  {highlightText(item.quantity?.toString() || "—")}
                </td>
                
                <td className="unit">
                  {item.unit || "шт."}
                </td>
                
                <td className="category">
                  <span title={item.category || "—"}>
                    {highlightText(item.category || "—")}
                  </span>
                </td>
                
                <td className="supply-id" title={item.supplyId || "—"}>
                  {item.supplyId ? highlightText(item.supplyId.slice(0, 8) + "...") : "—"}
                </td>
                
                <td className="arrival-date">
                  {formatDate(item.createdAt || item.arrivalDate)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      <div className="warehouse-info">
        <p><strong>Информация о складе:</strong></p>
        <ul>
          <li>✅ Материалы автоматически добавляются после одобрения поставки</li>
          <li>📊 Общее количество материалов обновляется в реальном времени</li>
          <li>📋 Наименование = Категория материала из поставки</li>
          <li>📦 Содержимое = Название материала из поставки</li>
          {searchTerm && (
            <li>🔍 Активен поиск по запросу: <strong>"{searchTerm}"</strong></li>
          )}
        </ul>
      </div>
    </div>
  );
}
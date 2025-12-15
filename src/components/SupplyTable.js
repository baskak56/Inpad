// src/components/SupplyTable.js
import React, { useState, useMemo } from "react";
import { useAppContext } from "../services/AppContext";
import "./SupplyTable.css";
import { showToast } from '../utils/toast';

export default function SupplyTable({ 
  supplies, 
  statusOptions, 
  getStatusClass, 
  getProjectName,
  loading 
}) {
  const { handleStatusChange, handleReportUpload } = useAppContext();
  
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [searchColumn, setSearchColumn] = useState("all");

  // 🔥 ФИЛЬТРАЦИЯ ДАННЫХ
  const filteredSupplies = useMemo(() => {
    if (!searchTerm.trim()) return supplies;
    
    const term = searchTerm.toLowerCase().trim();
    
    return supplies.filter(supply => {
      switch (searchColumn) {
        case 'name':
          return supply.supplyName?.toLowerCase().includes(term);
        
        case 'project':
          const projectName = getProjectName ? getProjectName(supply.projectId) : '';
          return projectName.toLowerCase().includes(term);
        
        case 'material':
          return supply.materials?.some(material => 
            material.name?.toLowerCase().includes(term)
          );
        
        case 'supplier':
          return supply.supplierName?.toLowerCase().includes(term);
        
        case 'category':
          return supply.materials?.some(material => 
            material.category?.toLowerCase().includes(term)
          );
        
        case 'all':
        default:
          return (
            supply.supplyName?.toLowerCase().includes(term) ||
            supply.supplierName?.toLowerCase().includes(term) ||
            supply.materials?.some(material => 
              material.name?.toLowerCase().includes(term) ||
              material.category?.toLowerCase().includes(term)
            ) ||
            (getProjectName ? getProjectName(supply.projectId)?.toLowerCase().includes(term) : false)
          );
      }
    });
  }, [supplies, searchTerm, searchColumn, getProjectName]);

  // 🔥 ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ОТДЕЛЬНЫХ СТРОК ДЛЯ КАЖДОГО МАТЕРИАЛА
  const getSupplyRows = () => {
    const rows = [];
    
    filteredSupplies.forEach((supply, supplyIndex) => {
      if (!supply.materials || !Array.isArray(supply.materials) || supply.materials.length === 0) {
        rows.push({
          ...supply,
          materialIndex: 0,
          isFirst: true,
          rowSpan: 1,
          material: { name: "—", category: "—", quantity: 0 }
        });
      } else {
        supply.materials.forEach((material, materialIndex) => {
          rows.push({
            ...supply,
            materialIndex,
            isFirst: materialIndex === 0,
            rowSpan: supply.materials.length,
            material: material
          });
        });
      }
    });
    
    return rows;
  };

  const handleFileChange = async (e, supplyId) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadingFiles(prev => ({ ...prev, [supplyId]: true }));
      try {
        await handleReportUpload(supplyId, files);
        showToast.success("Документы успешно загружены");
      } catch (error) {
        console.error("Ошибка загрузки документов:", error);
showToast.error("Не удалось загрузить документы: " + error.message);
      } finally {
        setUploadingFiles(prev => ({ ...prev, [supplyId]: false }));
      }
      e.target.value = '';
    }
  };

  const handleStatusChangeInternal = async (id, newStatus) => {
    try {
      await handleStatusChange(id, newStatus);
    } catch (error) {
      console.error("Ошибка обновления статуса:", error);
showToast.error("Не удалось обновить статус: " + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU");
    } catch {
      return "—";
    }
  };

  // 🔥 ФУНКЦИЯ ПОДСВЕТКИ ТЕКСТА
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

  const supplyRows = getSupplyRows();

  return (
    <div className="table-wrapper">
      {/* 🔥 ПАНЕЛЬ ПОИСКА */}
      <div className="search-panel">
        <div className="search-controls">
          <div className="search-input-group">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="Поиск по поставкам..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              disabled={loading}
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
            disabled={loading}
          >
            <option value="all">Везде</option>
            <option value="name">Название поставки</option>
            <option value="project">Проект</option>
            <option value="material">Материал</option>
            <option value="supplier">Поставщик</option>
            <option value="category">Категория</option>
          </select>
          
          <div className="search-info">
            <span className="search-count">
              Найдено: <strong>{filteredSupplies.length}</strong> из {supplies.length}
            </span>
          </div>
        </div>
      </div>

      <table className="supply-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Название поставки</th>
            <th>Проект</th>
            <th>Материал</th>
            <th>Категория</th>
            <th>Количество</th>
            <th>Поставщик</th>
            <th>Дата создания</th>
            <th>Статус</th>
            <th>Отчет</th>
          </tr>
        </thead>
        <tbody>
          {supplyRows.length === 0 ? (
            <tr>
              <td colSpan="10" className="empty-table">
                {searchTerm 
                  ? "По вашему запросу ничего не найдено" 
                  : "Нет данных о поставках"}
              </td>
            </tr>
          ) : (
            supplyRows.map((row, index) => (
              <tr key={`${row.id}-${row.materialIndex}`}>
                {/* Номер строки - только для первой строки поставки */}
                {row.isFirst && (
                  <td rowSpan={row.rowSpan}>
                    {index + 1}
                  </td>
                )}
                
                {/* Название поставки - только для первой строки */}
                {row.isFirst && (
                  <td className="supply-name" rowSpan={row.rowSpan}>
                    {highlightText(row.supplyName)}
                    <div className="project-info">
                      <small>
                        Проект: {getProjectName ? highlightText(getProjectName(row.projectId)) : `Проект ${row.projectId}`}
                      </small>
                    </div>
                  </td>
                )}
                
                {/* Проект - только для первой строки */}
                {row.isFirst && (
                  <td className="project-column" rowSpan={row.rowSpan}>
                    {getProjectName ? highlightText(getProjectName(row.projectId)) : `Проект ${row.projectId}`}
                  </td>
                )}
                
                {/* Материал - отдельная строка для каждого материала */}
                <td className="material-data">
                  {highlightText(row.material.name || "—")}
                </td>
                
                {/* Категория материала */}
                <td>
                  {highlightText(row.material.category || "—")}
                </td>
                
                {/* Количество материала */}
                <td className="quantity-item">
                  {row.material.quantity || 0}
                </td>
                
                {/* Поставщик - только для первой строки */}
                {row.isFirst && (
                  <td rowSpan={row.rowSpan}>
                    {highlightText(row.supplierName)}
                  </td>
                )}
                
                {/* Дата создания - только для первой строки */}
                {row.isFirst && (
                  <td rowSpan={row.rowSpan}>
                    {formatDate(row.createdAt)}
                  </td>
                )}
                
                {/* Статус - только для первой строки */}
                {row.isFirst && (
                  <td rowSpan={row.rowSpan}>
                    <select
                      value={row.status || "создана"}
                      onChange={(e) => handleStatusChangeInternal(row.id, e.target.value)}
                      className={`status-select ${getStatusClass(row.status)}`}
                      disabled={loading || uploadingFiles[row.id]}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
                
                {/* Отчет - только для первой строки */}
                {row.isFirst && (
                  <td rowSpan={row.rowSpan}>
                    {(row.status && row.status.toLowerCase() === "доставлено") ? (
                      <div className="report-upload">
                        <input
                          type="file"
                          id={`report-${row.id}`}
                          accept="image/*,.pdf,.doc,.docx"
                          multiple
                          onChange={(e) => handleFileChange(e, row.id)}
                          className="report-input"
                          disabled={uploadingFiles[row.id] || loading}
                        />
                        <label htmlFor={`report-${row.id}`} className="report-label">
                          {uploadingFiles[row.id] 
                            ? "⏳ Загрузка..." 
                            : row.documents && row.documents.length > 0 
                              ? `📎 Документы (${row.documents.length})` 
                              : "📎 Загрузить документы"}
                        </label>
                      </div>
                    ) : (
                      <span className="report-disabled">Заблокировано</span>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
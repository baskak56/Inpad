// src/components/InspectionTable.js
import React, { useState, useMemo } from "react";
import { useAppContext } from "../services/AppContext";
import { suppliesAPI, API_BASE_URL } from "../services/api";
import { showToast } from '../utils/toast';
import "./InspectionTable.css";

export default function InspectionTable({ 
  supplies, 
  loading 
}) {
  const { handleInspectionApprove, handleInspectionReject } = useAppContext();
  
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedSupply, setSelectedSupply] = useState(null);
  const [viewingDocuments, setViewingDocuments] = useState(null);
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
        
        case 'documents':
          return supply.documents?.some(doc => 
            typeof doc === 'string' && doc.toLowerCase().includes(term)
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
            supply.documents?.some(doc => 
              typeof doc === 'string' && doc.toLowerCase().includes(term)
            )
          );
      }
    });
  }, [supplies, searchTerm, searchColumn]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU");
    } catch {
      return "—";
    }
  };

  const checkGOSTCompliance = (supply) => {
    return "❌";
  };

  const getUnits = (materials) => {
    if (!materials || !Array.isArray(materials) || materials.length === 0) return "шт.";
    return "шт.";
  };

  const handleViewDocument = async (supplyId, documentPath) => {
    const getCleanPath = (path) => {
      if (path.startsWith('/uploads/')) {
        return path.substring(9);
      } else if (path.startsWith('uploads/')) {
        return path.substring(8);
      }
      return path;
    };

    try {
      const response = await suppliesAPI.downloadDocument(supplyId, documentPath);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.height = '800px';
        iframe.style.border = 'none';
        
        const newWindow = window.open();
        newWindow.document.write(`
          <html>
            <head><title>Просмотр документа</title></head>
            <body style="margin:0;padding:0">
              ${iframe.outerHTML}
            </body>
          </html>
        `);
        newWindow.document.close();
        
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        throw new Error(`Ошибка: ${response.status}`);
      }
    } catch (error) {
      console.error('View document error:', error);
      
      const token = localStorage.getItem("authToken");
      const cleanPath = getCleanPath(documentPath);
      
      const encodedPath = encodeURIComponent(cleanPath);
      const url = `${API_BASE_URL}/api/Supplies/${supplyId}/documents/${encodedPath}?authorization=Bearer%20${encodeURIComponent(token || '')}`;
      
      window.open(url, '_blank');
    }
  };

  const handleDownloadDocument = async (supplyId, documentPath) => {
    try {
      const response = await suppliesAPI.downloadDocument(supplyId, documentPath);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = documentPath.split('/').pop() || 'document';
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      const url = suppliesAPI.previewDocument(supplyId, documentPath);
      showToast.info(`Скачать документ можно по ссылке:\n${url}`, {
  autoClose: 10000 // Дольше показывать, чтобы успеть прочитать ссылку
});
    }
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

  const renderDocuments = (documents, supplyId) => {
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return "—";
    }

    return (
      <div className="documents-list">
        {documents.slice(0, 3).map((doc, index) => {
          const fileName = typeof doc === 'string' ? doc.split('/').pop() : `Документ ${index + 1}`;
          return (
            <div key={index} className="document-item">
              <div className="document-actions">
                <span 
                  className="document-link"
                  onClick={() => handleViewDocument(supplyId, doc)}
                  title="Просмотреть документ"
                >
                  👁️ {highlightText(fileName)}
                </span>
                <button 
                  className="download-doc-btn"
                  onClick={() => handleDownloadDocument(supplyId, doc)}
                  title="Скачать документ"
                >
                  ⬇️
                </button>
              </div>
            </div>
          );
        })}
        {documents.length > 3 && (
          <button 
            className="view-all-docs-btn"
            onClick={() => setViewingDocuments({ supplyId, documents })}
          >
            + ещё {documents.length - 3}
          </button>
        )}
      </div>
    );
  };

  const handleCloseDocumentView = () => {
    setViewingDocuments(null);
  };

  const getInspectionRows = () => {
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

  const handleRejectClick = (supply) => {
    setSelectedSupply(supply);
    setRejectionReason("");
  };

  const handleConfirmReject = async () => {
    if (selectedSupply && rejectionReason.trim()) {
      try {
        await handleInspectionReject(selectedSupply.id, rejectionReason.trim());
        setSelectedSupply(null);
        setRejectionReason("");
        showToast.success("Поставка отклонена");
      } catch (error) {
        showToast.error("Не удалось отклонить поставку: " + error.message);
      }
    }
  };

  const handleCancelReject = () => {
    setSelectedSupply(null);
    setRejectionReason("");
  };

  const handleApproveClick = async (supplyId) => {
    try {
      await handleInspectionApprove(supplyId);
      showToast.success("Поставка одобрена и добавлена на склад");
    } catch (error) {
      showToast.error("Не удалось одобрить поставку: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="table-wrapper">
        <div className="loading">Загрузка поставок для проверки...</div>
      </div>
    );
  }

  const inspectionRows = getInspectionRows();

  return (
    <>
      <div className="table-wrapper inspection-table-wrapper">
        {/* 🔥 ПАНЕЛЬ ПОИСКА */}
        <div className="search-panel">
          <div className="search-controls">
            <div className="search-input-group">
              <span className="search-icon"></span>
              <input
                type="text"
                placeholder="Поиск в проверках..."
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
              <option value="material">Материал</option>
              <option value="supplier">Поставщик</option>
              <option value="category">Категория</option>
              <option value="documents">Документы</option>
            </select>
            
            <div className="search-info">
              <span className="search-count">
                На проверку: <strong>{filteredSupplies.length}</strong> из {supplies.length}
              </span>
            </div>
          </div>
        </div>

        <table className="inspection-table">
          <thead>
            <tr>
              <th>№ пост.</th>
              <th>Наим.</th>
              <th>Материал</th>
              <th>Кол-во</th>
              <th>Ед. изм.</th>
              <th>Кат.</th>
              <th>ID</th>
              <th>Документы</th>
              <th>ГОСТ</th>
              <th>Дата пост.</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {inspectionRows.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty-table">
                  {searchTerm 
                    ? "По вашему запросу ничего не найдено" 
                    : "Нет поставок для проверки"}
                </td>
              </tr>
            ) : (
              inspectionRows.map((row, index) => (
                <tr key={`${row.id}-${row.materialIndex}`} className="inspection-row">
                  {row.isFirst && (
                    <td className="supply-number" rowSpan={row.rowSpan}>
                      {index + 1}
                    </td>
                  )}
                  
                  {row.isFirst && (
                    <td className="supply-name" rowSpan={row.rowSpan}>
                      {highlightText(row.supplyName)}
                    </td>
                  )}
                  
                  <td className="material-name">
                    {highlightText(row.material.name || "—")}
                  </td>
                  
                  <td className="quantity">
                    {row.material.quantity || 0}
                  </td>
                  
                  <td className="units">{getUnits(row.materials)}</td>
                  
                  <td className="category">
                    {highlightText(row.material.category || "—")}
                  </td>
                  
                  {row.isFirst && (
                    <td className="supply-id" rowSpan={row.rowSpan}>
                      {row.id.slice(0, 8)}...
                    </td>
                  )}
                  
                  {row.isFirst && (
                    <td className="documents" rowSpan={row.rowSpan}>
                      {renderDocuments(row.documents, row.id)}
                    </td>
                  )}
                  
                  {row.isFirst && (
                    <td className="gost-compliance" rowSpan={row.rowSpan}>
                      {checkGOSTCompliance(row)}
                    </td>
                  )}
                  
                  {row.isFirst && (
                    <td className="supply-date" rowSpan={row.rowSpan}>
                      {row.expectedDate ? formatDate(row.expectedDate) : formatDate(row.createdAt)}
                    </td>
                  )}
                  
                  {row.isFirst && (
                    <td rowSpan={row.rowSpan}>
                      <div className="inspection-actions">
                        <button 
                          onClick={() => handleApproveClick(row.id)}
                          className="approve-btn"
                          title="Одобрить поставку"
                          disabled={loading}
                        >
                          ✓ Одобрить
                        </button>
                        <button 
                          onClick={() => handleRejectClick(row)}
                          className="reject-btn"
                          title="Отклонить поставку"
                          disabled={loading}
                        >
                          ✕ Отклонить
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Модальное окно для указания причины отклонения */}
      {selectedSupply && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Отклонение поставки</h3>
            <p>Укажите причину отклонения поставки "<strong>{selectedSupply.supplyName}</strong>":</p>
            <div className="documents-preview">
              <strong>Документы:</strong>
              {selectedSupply.documents && selectedSupply.documents.length > 0 ? (
                <div className="documents-list-modal">
                  {selectedSupply.documents.map((doc, index) => {
                    const fileName = typeof doc === 'string' ? doc.split('/').pop() : `Документ ${index + 1}`;
                    return (
                      <div key={index} className="document-item-modal">
                        <div className="document-actions">
                          <span 
                            className="document-link"
                            onClick={() => handleViewDocument(selectedSupply.id, doc)}
                            title="Просмотреть документ"
                          >
                            👁️ {fileName}
                          </span>
                          <button 
                            className="download-doc-btn"
                            onClick={() => handleDownloadDocument(selectedSupply.id, doc)}
                            title="Скачать документ"
                          >
                            ⬇️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span> Нет документов</span>
              )}
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Введите причину отклонения..."
              rows="4"
              className="rejection-textarea"
            />
            <div className="modal-actions">
              <button 
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim() || loading}
                className="confirm-reject-btn"
              >
                Подтвердить отклонение
              </button>
              <button onClick={handleCancelReject} className="cancel-reject-btn">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ ПРОСМОТРА ВСЕХ ДОКУМЕНТОВ */}
      {viewingDocuments && (
        <div className="modal-overlay">
          <div className="modal-content documents-modal">
            <h3>Документы поставки</h3>
            <div className="documents-grid">
              {viewingDocuments.documents.map((doc, index) => {
                const fileName = typeof doc === 'string' ? doc.split('/').pop() : `Документ ${index + 1}`;
                return (
                  <div key={index} className="document-card">
                    <div className="document-preview">
                      <div className="document-icon">📄</div>
                      <span className="document-name">
                        {highlightText(fileName)}
                      </span>
                    </div>
                    <div className="document-card-actions">
                      <button 
                        className="view-doc-btn"
                        onClick={() => handleViewDocument(viewingDocuments.supplyId, doc)}
                      >
                        👁️ Открыть
                      </button>
                      <button 
                        className="download-doc-btn"
                        onClick={() => handleDownloadDocument(viewingDocuments.supplyId, doc)}
                      >
                        ⬇️ Скачать
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="modal-actions">
              <button onClick={handleCloseDocumentView} className="cancel-reject-btn">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
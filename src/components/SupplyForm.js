// src/components/SupplyForm.js
import React from "react";
import "./SupplyForm.css";

export default function SupplyForm({ 
  newSupply, 
  handleInputChange, 
  handleMaterialChange,
  handleAddMaterial,
  handleRemoveMaterial,
  handleSubmitSupply, 
  handleCancelAdd,
  projects,
  loading 
}) {
  return (
    <div className="add-supply-form-container">
      <h3>Добавить новую поставку</h3>
      <form className="add-supply-form" onSubmit={handleSubmitSupply}>
        <div className="form-grid">
          {/* Проект */}
          <div className="form-group">
            <label className="required">Проект:</label>
            <select 
              name="projectId" 
              value={newSupply.projectId} 
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="">Выберите проект</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Название поставки */}
          <div className="form-group">
            <label className="required">Название поставки:</label>
            <input 
              type="text" 
              name="supplyName" 
              value={newSupply.supplyName} 
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Введите название поставки"
            />
          </div>

          {/* Поставщик */}
          <div className="form-group">
            <label className="required">Поставщик:</label>
            <input 
              type="text" 
              name="supplierName" 
              value={newSupply.supplierName} 
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Введите название поставщика"
            />
          </div>

          {/* Email поставщика */}
          <div className="form-group">
            <label>Email поставщика:</label>
            <input 
              type="email" 
              name="supplierEmail" 
              value={newSupply.supplierEmail} 
              onChange={handleInputChange}
              disabled={loading}
              placeholder="email@example.com"
            />
          </div>
        </div>

        {/* Материалы */}
        <div className="materials-section">
          <h4>Материалы:</h4>
          {newSupply.materials.map((material, index) => (
            <div key={index} className="material-item">
              <div className="material-header">
                <h5>Материал #{index + 1}</h5>
                {newSupply.materials.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveMaterial(index)}
                    className="remove-material-btn danger"
                    disabled={loading}
                  >
                    Удалить
                  </button>
                )}
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="required">Название материала:</label>
                  <input 
                    type="text" 
                    value={material.name}
                    onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Например: Цемент М500"
                  />
                </div>
                
                <div className="form-group">
                  <label>Категория:</label>
                  <input 
                    type="text" 
                    value={material.category}
                    onChange={(e) => handleMaterialChange(index, 'category', e.target.value)}
                    disabled={loading}
                    placeholder="Например: Строительные материалы"
                  />
                </div>
                
                <div className="form-group">
                  <label>Описание:</label>
                  <input 
                    type="text" 
                    value={material.content}
                    onChange={(e) => handleMaterialChange(index, 'content', e.target.value)}
                    disabled={loading}
                    placeholder="Описание материала"
                  />
                </div>
                
                <div className="form-group">
                  <label className="required">Количество:</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={material.quantity}
                    onChange={(e) => handleMaterialChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    required
                    disabled={loading}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={handleAddMaterial} 
            className="add-material-btn"
            disabled={loading}
          >
            + Добавить материал
          </button>
        </div>

        <div className="form-buttons">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Создание..." : "Создать поставку"}
          </button>
          <button type="button" onClick={handleCancelAdd} className="cancel-btn">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
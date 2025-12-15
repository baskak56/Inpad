// src/components/ProjectManagement.js
import React, { useState, useEffect } from 'react';
import { useAppContext } from "../services/AppContext";
import './ProjectManagement.css';
import SupplyTable from './SupplyTable';
import InspectionTable from './InspectionTable';
import SupplyForm from './SupplyForm';
import WarehouseTable from './WarehouseTable';
import WriteOffTable from './WriteOffTable';
import { showToast } from '../utils/toast';

export default function ProjectManagement({ 
  activeProjectId,
  activeTab,
  onTabChange,
  onProjectSelect,
  supplyStatusOptions,
  getStatusClass,
  userRole
}) {
  const [expandedProject, setExpandedProject] = useState(activeProjectId);
  const [currentTab, setCurrentTab] = useState(activeTab || 'supplies');
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false);

  const {
    getAvailableProjects,
    getProjectName,
    getAvailableSupplies,
    supplies,
    inspectionSupplies,
    warehouseItems,
    loading,
    handleAddSupply,
    handleStatusChange,
    handleReportUpload,
    handleInspectionApprove,
    handleInspectionReject,
    loadProjectWarehouse
  } = useAppContext();

  const projects = getAvailableProjects();
  const availableSupplies = getAvailableSupplies(supplies);
  const availableInspections = getAvailableSupplies(inspectionSupplies);

  // Синхронизация с роутингом
  useEffect(() => {
    if (activeProjectId && activeProjectId !== expandedProject) {
      setExpandedProject(activeProjectId);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  // Форма поставки
  const [newSupply, setNewSupply] = useState({
    projectId: "",
    supplyName: "",
    supplierName: "",
    supplierEmail: "",
    materials: [
      {
        name: "",
        category: "",
        content: "",
        quantity: 0,
      }
    ],
    documents: []
  });

  const toggleProjectsCollapse = () => {
    setIsProjectsCollapsed(!isProjectsCollapsed);
  };

  const handleTabClick = (tab) => {
    setCurrentTab(tab);
    if (onTabChange && expandedProject) {
      onTabChange(tab);
    }
  };

  const handleProjectClick = (projectId) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
      setCurrentTab('supplies');
      setShowSupplyForm(false);
    } else {
      setExpandedProject(projectId);
      setShowSupplyForm(false);
    }
    
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  };

  // Функция для создания поставки в выбранном проекте
  const handleAddSupplyToProject = () => {
    if (!expandedProject) {
  showToast.warning("Сначала выберите проект");
  return;
}
    
    setNewSupply(prev => ({
      ...prev,
      projectId: expandedProject
    }));
    setShowSupplyForm(true);
  };

  // Обработчики формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupply((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaterialChange = (index, field, value) => {
    setNewSupply(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const handleAddMaterial = () => {
    setNewSupply(prev => ({
      ...prev,
      materials: [
        ...prev.materials,
        { name: "", category: "", content: "", quantity: 0 }
      ]
    }));
  };

  const handleRemoveMaterial = (index) => {
    setNewSupply(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handleCancelAdd = () => {
    setShowSupplyForm(false);
    setNewSupply({
      projectId: expandedProject || "",
      supplyName: "",
      supplierName: "",
      supplierEmail: "",
      materials: [
        {
          name: "",
          category: "",
          content: "",
          quantity: 0,
        }
      ],
      documents: []
    });
  };

  // Обработчик отправки формы
  const handleSubmitSupply = async (e) => {
    e.preventDefault();
    
    if (!newSupply.projectId || !newSupply.supplyName || !newSupply.supplierName) {
  showToast.warning("Заполните обязательные поля: название поставки и поставщик");
  return;
}

    if (newSupply.materials.some(material => !material.name || material.quantity <= 0)) {
  showToast.warning("Заполните название и количество (больше 0) для всех материалов");
  return;
}

    try {
      const success = await handleAddSupply(newSupply);
      if (success) {
        setShowSupplyForm(false);
        setNewSupply({
          projectId: expandedProject || "",
          supplyName: "",
          supplierName: "",
          supplierEmail: "",
          materials: [
            {
              name: "",
              category: "",
              content: "",
              quantity: 0,
            }
          ],
          documents: []
        });
      }
    } catch (error) {
      showToast.error("Не удалось создать поставку: " + error.message);
    }
  };

  // Фильтрация данных по выбранному проекту
  const getProjectSupplies = () => {
    if (!expandedProject) return [];
    return availableSupplies.filter(supply => supply.projectId === expandedProject);
  };

  const getProjectInspections = () => {
    if (!expandedProject) return [];
    return availableInspections.filter(supply => supply.projectId === expandedProject);
  };

  const getProjectWarehouseItems = () => {
    if (!expandedProject) return [];
    return warehouseItems[expandedProject] || [];
  };

  // Рендеринг контента проекта
  const renderProjectContent = () => {
    if (!expandedProject) {
      return <div className="no-project-selected">Выберите проект для просмотра деталей</div>;
    }

    const projectSupplies = getProjectSupplies();
    const projectInspections = getProjectInspections();
    const currentProject = projects.find(p => p.id === expandedProject) || {};

    return (
      <div className="project-details">
        <div className="project-header">
          <div className="project-title-section">
            <h3>{currentProject.name}</h3>
            <span className="project-address">{currentProject.address}</span>
          </div>
        </div>

        {/* Форма создания поставки */}
        {showSupplyForm && (
          <div className="supply-form-in-project">
            <h4>Создать поставку в проекте "{currentProject.name}"</h4>
            <SupplyForm
              newSupply={newSupply}
              handleInputChange={handleInputChange}
              handleMaterialChange={handleMaterialChange}
              handleAddMaterial={handleAddMaterial}
              handleRemoveMaterial={handleRemoveMaterial}
              handleSubmitSupply={handleSubmitSupply}
              handleCancelAdd={handleCancelAdd}
              projects={projects.filter(p => p.id === expandedProject)}
              loading={loading.supplies}
            />
          </div>
        )}

        {/* Вкладки */}
        {!showSupplyForm && (
          <>
            <div className="project-tabs">
              <button 
                className={`tab-button ${currentTab === 'supplies' ? 'active' : ''}`}
                onClick={() => handleTabClick('supplies')}
              >
                📦 Поставки ({projectSupplies.length})
              </button>
              <button 
                className={`tab-button ${currentTab === 'inspections' ? 'active' : ''}`}
                onClick={() => handleTabClick('inspections')}
              >
                🔍 Проверка ({projectInspections.length})
              </button>
              <button 
                className={`tab-button ${currentTab === 'warehouse' ? 'active' : ''}`}
                onClick={() => handleTabClick('warehouse')}
              >
                🏪 Склад
              </button>
              <button 
                className={`tab-button ${currentTab === 'writeoff' ? 'active' : ''}`}
                onClick={() => handleTabClick('writeoff')}
              >
                📝 Списание
              </button>
            </div>

            {/* Контент вкладок */}
            <div className="tab-content">
              {currentTab === 'supplies' && (
                <div className="supplies-tab">
                  <div className="supplies-header">
                    <h4>Поставки проекта "{currentProject.name}"</h4>
                    {["Admin", "Manager"].includes(userRole) && (
                      <button 
                        onClick={handleAddSupplyToProject}
                        className="add-supply-to-project-btn"
                        disabled={loading.supplies}
                      >
                        + Добавить поставку
                      </button>
                    )}
                  </div>
                  
                  <SupplyTable
                    supplies={projectSupplies}
                    statusOptions={supplyStatusOptions}
                    getStatusClass={getStatusClass}
                    getProjectName={getProjectName}
                    loading={loading.supplies}
                  />
                </div>
              )}

              {currentTab === 'inspections' && (
                <div className="inspection-tab">
                  <h4>Проверка поставок в проекте "{currentProject.name}"</h4>
                  
                  <InspectionTable
                    supplies={projectInspections}
                    loading={loading.supplies}
                  />
                </div>
              )}

              {currentTab === 'writeoff' && (
                <div className="writeoff-tab">
                  <WriteOffTable
                    projectId={expandedProject}
                    loading={loading.supplies}
                    userRole={userRole}
                    onWriteOffSuccess={() => {
                      loadProjectWarehouse(expandedProject);
                    }}
                  />
                </div>
              )}

              {currentTab === 'warehouse' && (
                <div className="warehouse-tab">
                  <WarehouseTable
                    warehouseItems={getProjectWarehouseItems()}
                    loading={loading.warehouse}
                    projectId={expandedProject}
                    onRefresh={() => loadProjectWarehouse(expandedProject)}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const canCreateSupplies = ["Admin", "Manager"].includes(userRole);

  return (
    <div className="project-management">
      <div className={`projects-layout ${isProjectsCollapsed ? 'collapsed' : ''}`}>
        <div className="projects-list-container">
          <div className="projects-list-header">
            {!isProjectsCollapsed && <h3>Мои проекты</h3>}
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
                    : "У вас нет доступных проектов. Обратитесь к администратору."}
                </p>
              ) : (
                projects.map(project => (
                  <div 
                    key={project.id} 
                    className={`project-item ${expandedProject === project.id ? 'active' : ''}`}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="project-info">
                      <h4>{project.name}</h4>
                      <span className="project-address">{project.address}</span>
                      <div className="project-stats">
                        <small>
                          Поставок: {availableSupplies.filter(s => s.projectId === project.id).length} | 
                          Проверок: {availableInspections.filter(s => s.projectId === project.id).length}
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
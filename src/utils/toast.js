// src/utils/toast.js
import { toast } from 'react-toastify';

// Цветовая палитра в соответствии с вашим дизайном
const TOAST_COLORS = {
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  default: '#007bff'
};

export const showToast = {
  // Успешные уведомления
  success: (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      style: { 
        backgroundColor: TOAST_COLORS.success,
        color: 'white'
      }
    });
  },

  // Ошибки
  error: (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      style: { 
        backgroundColor: TOAST_COLORS.error,
        color: 'white'
      }
    });
  },

  // Предупреждения
  warning: (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      style: { 
        backgroundColor: TOAST_COLORS.warning,
        color: '#212529'
      }
    });
  },

  // Информационные
  info: (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      style: { 
        backgroundColor: TOAST_COLORS.info,
        color: 'white'
      }
    });
  },

  // Обычные сообщения
  default: (message) => {
    toast(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      style: { 
        backgroundColor: TOAST_COLORS.default,
        color: 'white'
      }
    });
  },

  // Подтверждение (заменяет confirm)
  confirm: (message, options = {}) => {
    const { onConfirm, onCancel, confirmText = 'Да', cancelText = 'Нет' } = options;
    
    const ConfirmToast = ({ closeToast }) => (
      <div className="confirm-toast-content">
        <div className="confirm-message">{message}</div>
        <div className="confirm-buttons">
          <button 
            className="confirm-btn confirm-yes-btn"
            onClick={() => {
              closeToast();
              if (onConfirm) onConfirm();
            }}
          >
            {confirmText}
          </button>
          <button 
            className="confirm-btn confirm-no-btn"
            onClick={() => {
              closeToast();
              if (onCancel) onCancel();
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    );

    toast(<ConfirmToast />, {
      position: "top-center",
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: false,
      closeButton: false,
      draggable: false,
      className: 'confirm-toast-container'
    });
  },

  // Загрузка/прогресс
  loading: (message) => {
    return toast.loading(message, {
      position: "top-right",
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: false,
      closeButton: false,
    });
  },

  // Обновить toast (для загрузки)
  update: (toastId, config) => {
    toast.update(toastId, config);
  },

  // Закрыть toast
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  }
};

// Для удобного импорта
export const toastSuccess = showToast.success;
export const toastError = showToast.error;
export const toastWarning = showToast.warning;
export const toastInfo = showToast.info;
export const toastConfirm = showToast.confirm;
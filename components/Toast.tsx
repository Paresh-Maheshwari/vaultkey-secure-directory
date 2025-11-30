import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18"/><path d="m6 6 18 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

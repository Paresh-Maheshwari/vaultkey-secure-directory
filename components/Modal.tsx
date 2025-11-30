import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity">
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-slate-700`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 p-1 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
};

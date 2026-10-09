import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-40 p-4">
      <div className="bg-navy-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-navy-600 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-navy-700">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

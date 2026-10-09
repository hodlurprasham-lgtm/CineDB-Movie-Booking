import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`fixed bottom-4 right-4 ${bg} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-bounce`}>
      <span>{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200 ml-2">&times;</button>
    </div>
  );
};

export default Toast;

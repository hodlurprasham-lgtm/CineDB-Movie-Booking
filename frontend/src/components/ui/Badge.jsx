import React from 'react';

const Badge = ({ status }) => {
  const getStyle = () => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'success':
        return 'bg-green-900/50 text-green-400 border-green-800';
      case 'cancelled':
      case 'failed':
      case 'error':
        return 'bg-red-900/50 text-red-400 border-red-800';
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-400 border-yellow-800';
      default:
        return 'bg-navy-700 text-slate-300 border-navy-600';
    }
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStyle()}`}>
      {status}
    </span>
  );
};

export default Badge;

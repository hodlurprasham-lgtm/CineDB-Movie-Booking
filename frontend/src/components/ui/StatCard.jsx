import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'text-cinered', subtitle }) => (
  <div className="bg-navy-800 rounded-xl p-6 border border-navy-700 relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cinered to-red-900 opacity-50 group-hover:opacity-100 transition-opacity"></div>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full bg-navy-900 border border-navy-700 ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export default StatCard;

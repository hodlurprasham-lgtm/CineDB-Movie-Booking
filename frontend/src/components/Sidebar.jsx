import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Film, Ticket, Code2, Table2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/movies', icon: Film, label: 'Movies' },
    { to: '/booking', icon: Ticket, label: 'Booking' },
    { to: '/sql', icon: Code2, label: 'SQL Playground' },
    { to: '/tables', icon: Table2, label: 'Table Manager' },
    { to: '/learn', icon: BookOpen, label: 'Learn DBMS' },
  ];

  return (
    <div className={`flex flex-col h-full bg-navy-800 border-r border-navy-700 transition-all duration-300 relative ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-center h-20 border-b border-navy-700">
        <span className="text-3xl">🎬</span>
        {!collapsed && <span className="ml-3 text-xl font-bold text-cinered-light">CineDB</span>}
      </div>
      
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 bg-navy-700 rounded-full p-1 text-slate-300 hover:text-white border border-navy-600"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="flex-1 py-6 space-y-2 px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-cinered text-white' 
                  : 'text-slate-400 hover:bg-navy-700 hover:text-white'
              } ${collapsed ? 'justify-center' : 'justify-start'}`
            }
            title={collapsed ? link.label : ''}
          >
            <link.icon size={20} className={collapsed ? '' : 'mr-3'} />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Table, Key, Link as LinkIcon, Database } from 'lucide-react';

const TableManager = () => {
  const [tables, setTables] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/schema/tables`);
      const data = await res.json();
      setTables(data);
      if (data.length > 0) {
        setActiveTab(data[0].name);
        fetchTableData(data[0].name, data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName, currentTables = tables) => {
    setLoading(true);
    try {
      const t = currentTables.find(x => x.name === tableName);
      if (t) setColumns(t.columns);

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/schema/tables/${tableName}/data`);
      const data = await res.json();
      setTableData(data.rows || []);
    } catch (e) {
      console.error(e);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (name) => {
    setActiveTab(name);
    fetchTableData(name, tables);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-white">Table Manager</h1>
      
      {tables.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-navy-700 hide-scrollbar">
          {tables.map(t => (
            <button
              key={t.name}
              onClick={() => handleTabClick(t.name)}
              className={`px-4 py-2 rounded-t-lg whitespace-nowrap flex items-center gap-2 font-medium transition-colors border-b-2 ${
                activeTab === t.name 
                  ? 'bg-navy-800 text-white border-cinered' 
                  : 'text-slate-400 border-transparent hover:bg-navy-800 hover:text-white'
              }`}
            >
              <Table size={16} /> {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Main Data View */}
        <div className="lg:col-span-3 bg-navy-800 border border-navy-700 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 bg-navy-900 border-b border-navy-700 flex justify-between items-center">
            <h2 className="font-bold text-white flex items-center gap-2"><Database size={18}/> Data View: {activeTab}</h2>
            <span className="text-sm text-slate-400">{tableData.length} records</span>
          </div>
          
          <div className="flex-1 overflow-auto bg-[#0a0e1a]">
            {loading ? <LoadingSpinner /> : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr>
                    {columns.map(c => (
                      <th key={c.name} className="sticky top-0 bg-navy-900 p-3 text-xs font-bold text-slate-300 border border-navy-700 shadow-sm z-10">
                        <div className="flex items-center gap-1">
                          {c.pk === 1 && <Key size={12} className="text-yellow-500" />}
                          {c.fk && <LinkIcon size={12} className="text-blue-400" />}
                          {c.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr key={i} className="hover:bg-navy-800 border-b border-navy-700/50 transition-colors">
                      {columns.map((c, j) => (
                        <td key={c.name} className="p-3 text-sm text-slate-300 font-mono border-r border-navy-700/50">
                          {row[j] !== null && row[j] !== undefined ? row[j].toString() : <span className="text-slate-600 italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {tableData.length === 0 && (
                    <tr><td colSpan={columns.length} className="p-8 text-center text-slate-500">No data found in this table.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Column Definitions */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 bg-navy-900 border-b border-navy-700">
            <h2 className="font-bold text-white">Structure</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {columns.map(c => (
              <div key={c.name} className="bg-navy-900 p-3 rounded-lg border border-navy-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{c.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-navy-700 text-slate-300 rounded">{c.type}</span>
                </div>
                <div className="text-xs text-slate-400 space-y-1 mt-2">
                  {c.pk === 1 && <div className="flex items-center gap-1 text-yellow-500"><Key size={12}/> Primary Key</div>}
                  {c.fk && <div className="flex items-center gap-1 text-blue-400"><LinkIcon size={12}/> Foreign Key → {c.fk.table}({c.fk.to})</div>}
                  {c.notnull === 1 && <div className="flex items-center gap-1 text-slate-300">NOT NULL</div>}
                  {c.dflt_value && <div className="flex items-center gap-1 text-slate-300">DEFAULT: {c.dflt_value}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default TableManager;

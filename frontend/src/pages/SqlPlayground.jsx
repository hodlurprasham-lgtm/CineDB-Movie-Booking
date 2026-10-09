import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trash, Database, Search, GitBranch, Table, Key, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';
import Toast from '../components/ui/Toast';
import Modal from '../components/ui/Modal';

const EXAMPLE_QUERIES = [
  // DDL
  { category: 'DDL', title: 'CREATE TABLE — demo_reviews', sql: `CREATE TABLE IF NOT EXISTS demo_reviews (\n  review_id INTEGER PRIMARY KEY AUTOINCREMENT,\n  movie_id INTEGER REFERENCES movies(movie_id),\n  reviewer_name TEXT NOT NULL,\n  review_text TEXT,\n  stars INTEGER CHECK(stars BETWEEN 1 AND 5),\n  created_at TEXT DEFAULT (datetime('now'))\n);` },
  { category: 'DDL', title: 'ALTER TABLE — add column', sql: `ALTER TABLE demo_reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;` },
  { category: 'DDL', title: 'CREATE INDEX', sql: `CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(show_date);` },
  { category: 'DDL', title: 'DROP TABLE — demo_reviews', sql: `DROP TABLE IF EXISTS demo_reviews;` },
  { category: 'DDL', title: 'TRUNCATE equivalent (SQLite)', sql: `-- SQLite does not support TRUNCATE TABLE.\n-- Use DELETE without WHERE to remove all rows:\n-- DELETE FROM demo_reviews;\n-- Then VACUUM to reclaim space:\n-- VACUUM;\n-- For safety, this example only SELECTs:\nSELECT 'SQLite uses DELETE FROM table_name instead of TRUNCATE' AS note;` },
  // DML
  { category: 'DML', title: 'INSERT — new movie', sql: `INSERT INTO movies (title, genre, language, duration_minutes, release_date, rating, description, poster_color)\nVALUES ('The Martian', 'Sci-Fi', 'English', 144, '2015-10-02', 8.0, 'An astronaut is stranded on Mars.', '#c0392b');` },
  { category: 'DML', title: 'INSERT — new customer', sql: `INSERT INTO customers (name, email, phone)\nVALUES ('Ravi Kumar', 'ravi.kumar@example.com', '9876543210');` },
  { category: 'DML', title: 'UPDATE — movie rating', sql: `UPDATE movies SET rating = 9.1 WHERE title = 'Inception';` },
  { category: 'DML', title: 'UPDATE — booking status', sql: `UPDATE bookings SET booking_status = 'Confirmed' WHERE booking_id = 1;` },
  { category: 'DML', title: 'DELETE — safe delete', sql: `DELETE FROM customers WHERE email = 'ravi.kumar@example.com';` },
  // DQL
  { category: 'DQL', title: 'SELECT — all movies', sql: `SELECT movie_id, title, genre, language, duration_minutes, rating FROM movies ORDER BY movie_id;` },
  { category: 'DQL', title: 'WHERE — filter by genre', sql: `SELECT title, genre, rating FROM movies WHERE genre = 'Action' ORDER BY rating DESC;` },
  { category: 'DQL', title: 'ORDER BY — sort by rating', sql: `SELECT title, genre, rating FROM movies ORDER BY rating DESC;` },
  { category: 'DQL', title: 'COUNT — total bookings', sql: `SELECT COUNT(*) AS total_bookings, SUM(total_amount) AS total_revenue FROM bookings WHERE booking_status = 'Confirmed';` },
  { category: 'DQL', title: 'SUM — revenue by theatre', sql: `SELECT t.theatre_name, SUM(p.amount) AS total_revenue FROM payments p JOIN bookings b ON p.booking_id = b.booking_id JOIN shows s ON b.show_id = s.show_id JOIN screens sc ON s.screen_id = sc.screen_id JOIN theatres t ON sc.theatre_id = t.theatre_id WHERE p.payment_status = 'Success' GROUP BY t.theatre_name ORDER BY total_revenue DESC;` },
  { category: 'DQL', title: 'GROUP BY — bookings per movie', sql: `SELECT m.title, COUNT(b.booking_id) AS total_bookings FROM movies m LEFT JOIN shows s ON m.movie_id = s.movie_id LEFT JOIN bookings b ON s.show_id = b.show_id AND b.booking_status != 'Cancelled' GROUP BY m.movie_id, m.title ORDER BY total_bookings DESC;` },
  { category: 'DQL', title: 'HAVING — movies with 2+ bookings', sql: `SELECT m.title, COUNT(b.booking_id) AS booking_count FROM movies m JOIN shows s ON m.movie_id = s.movie_id JOIN bookings b ON s.show_id = b.show_id WHERE b.booking_status = 'Confirmed' GROUP BY m.movie_id, m.title HAVING booking_count >= 2 ORDER BY booking_count DESC;` },
  { category: 'DQL', title: 'JOIN — customers + bookings + movies', sql: `SELECT c.name AS customer, m.title AS movie, s.show_date, s.show_time, b.total_amount, b.booking_status FROM customers c JOIN bookings b ON c.customer_id = b.customer_id JOIN shows s ON b.show_id = s.show_id JOIN movies m ON s.movie_id = m.movie_id ORDER BY b.booking_date DESC LIMIT 10;` },
  { category: 'DQL', title: 'LEFT JOIN — movies with no bookings', sql: `SELECT m.title, m.genre, COALESCE(COUNT(b.booking_id), 0) AS bookings FROM movies m LEFT JOIN shows s ON m.movie_id = s.movie_id LEFT JOIN bookings b ON s.show_id = b.show_id AND b.booking_status != 'Cancelled' GROUP BY m.movie_id, m.title HAVING bookings = 0;` },
  { category: 'DQL', title: 'Most popular movies', sql: `SELECT m.title, m.genre, m.rating, COUNT(b.booking_id) AS total_bookings, SUM(b.total_amount) AS revenue FROM movies m JOIN shows s ON m.movie_id = s.movie_id JOIN bookings b ON s.show_id = b.show_id WHERE b.booking_status = 'Confirmed' GROUP BY m.movie_id, m.title ORDER BY total_bookings DESC LIMIT 5;` },
];

const SqlPlayground = () => {
  const [query, setQuery] = useState('SELECT * FROM movies LIMIT 5;');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [schema, setSchema] = useState([]);
  const [toast, setToast] = useState(null);
  const [resetModal, setResetModal] = useState(false);
  const [expandedTables, setExpandedTables] = useState({});
  const [executionTime, setExecutionTime] = useState(0);

  const textareaRef = useRef(null);
  const linesRef = useRef(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/schema/tables`);
      setSchema(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleScroll = () => {
    if (linesRef.current && textareaRef.current) {
      linesRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    
    const startTime = performance.now();
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sql/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: query })
      });
      const data = await res.json();
      
      const time = Math.round(performance.now() - startTime);
      setExecutionTime(time);
      
      if (!res.ok) {
        throw new Error(data.error || 'Syntax error or invalid query');
      }
      
      setResult(data);
      setHistory([{ query, time: new Date().toLocaleTimeString(), success: true }, ...history].slice(0, 20));
      
      // Refresh schema in case of DDL changes
      if (query.toUpperCase().includes('CREATE') || query.toUpperCase().includes('ALTER') || query.toUpperCase().includes('DROP')) {
        fetchSchema();
      }
      
    } catch (e) {
      setError(e.message);
      setHistory([{ query, time: new Date().toLocaleTimeString(), success: false }, ...history].slice(0, 20));
    } finally {
      setLoading(false);
    }
  };

  const resetDB = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sql/reset`, { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      setToast({ message: 'Database reset successfully', type: 'success' });
      setResetModal(false);
      fetchSchema();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const toggleTable = (tableName) => {
    setExpandedTables({ ...expandedTables, [tableName]: !expandedTables[tableName] });
  };

  const lineCount = query.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">SQL Playground</h1>
        <div className="flex gap-2">
          <select 
            className="bg-navy-800 border border-navy-700 text-white rounded-lg px-3 py-2 outline-none"
            onChange={(e) => setQuery(e.target.value)}
          >
            <option value="">Load Example Query...</option>
            {['DDL', 'DML', 'DQL'].map(cat => (
              <optgroup key={cat} label={cat}>
                {EXAMPLE_QUERIES.filter(q => q.category === cat).map((q, i) => (
                  <option key={i} value={q.sql}>{q.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button onClick={() => setResetModal(true)} className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded-lg flex items-center gap-2">
            <RotateCcw size={16} /> Reset DB
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Left Panel: Editor & Results */}
        <div className="lg:col-span-3 flex flex-col space-y-4 min-h-0">
          
          {/* Editor */}
          <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden flex flex-col shadow-lg">
            <div className="bg-navy-900 border-b border-navy-700 px-4 py-2 flex justify-between items-center">
              <span className="text-slate-400 text-sm font-mono flex items-center gap-2"><Database size={14}/> cine.db</span>
              <div className="flex gap-2">
                <button onClick={() => setQuery('')} className="px-3 py-1 bg-navy-700 hover:bg-navy-600 text-white text-sm rounded flex items-center gap-1">
                  <Trash size={14} /> Clear
                </button>
                <button onClick={executeQuery} disabled={loading} className="px-4 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded flex items-center gap-1 font-medium">
                  {loading ? 'Running...' : <><Play size={14} /> Execute</>}
                </button>
              </div>
            </div>
            <div className="relative flex-1 min-h-[250px] bg-[#0d1117] flex">
              <div ref={linesRef} className="w-10 bg-navy-900 text-slate-500 text-right pr-2 py-4 font-mono text-sm overflow-hidden border-r border-navy-700 select-none">
                {lines.map(l => <div key={l}>{l}</div>)}
              </div>
              <textarea 
                ref={textareaRef}
                className="flex-1 bg-transparent text-[#c9d1d9] font-mono text-sm p-4 outline-none resize-none whitespace-pre leading-normal"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onScroll={handleScroll}
                spellCheck="false"
                placeholder="Type your SQL query here..."
              ></textarea>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 bg-navy-800 rounded-xl border border-navy-700 flex flex-col min-h-[300px] overflow-hidden">
            <div className="bg-navy-900 border-b border-navy-700 px-4 py-2 flex justify-between items-center text-sm">
              <span className="font-medium text-white">Results</span>
              {result && <span className="text-slate-400">Time: {executionTime}ms | Rows: {result.rowcount || result.changes || 0}</span>}
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-[#0a0e1a]">
              {error && (
                <div className="bg-red-900/20 border border-red-900 rounded-lg p-4 flex items-start gap-3 text-red-400">
                  <AlertCircle className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1">Execution Error</h4>
                    <p className="font-mono text-sm">{error}</p>
                  </div>
                </div>
              )}
              
              {result && !error && (
                <>
                  {result.columns ? (
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead>
                        <tr>
                          {result.columns.map((c, i) => (
                            <th key={i} className="sticky top-0 bg-navy-900 p-2 text-xs font-mono text-slate-400 border border-navy-700">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((r, i) => (
                          <tr key={i} className="hover:bg-navy-800">
                            {result.columns.map((c, j) => (<td key={j} className="p-2 border border-navy-700 text-sm font-mono text-slate-300">{r[j] !== null && r[j] !== undefined ? String(r[j]) : <span className="text-slate-500 italic">null</span>}</td>))}
                          </tr>
                        ))}
                        {result.rows.length === 0 && (
                          <tr><td colSpan={result.columns.length} className="p-4 text-center text-slate-500 italic">No rows returned</td></tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <div className="bg-green-900/20 border border-green-900 rounded-lg p-4 flex items-center gap-3 text-green-400">
                      <CheckCircle className="shrink-0" />
                      <div>
                        <h4 className="font-bold">Query Executed Successfully</h4>
                        <p className="text-sm">Rows affected: {result.changes || 0}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {!result && !error && !loading && (
                <div className="h-full flex items-center justify-center text-slate-500 italic">
                  Execute a query to see results here
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Right Panel: Schema Explorer & History */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 flex flex-col overflow-hidden max-h-[calc(100vh-8rem)]">
          <div className="bg-navy-900 border-b border-navy-700 px-4 py-3 font-medium text-white flex justify-between">
            Schema Explorer
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {schema.map(table => (
              <div key={table.name} className="mb-2">
                <button 
                  onClick={() => toggleTable(table.name)}
                  className="w-full flex items-center justify-between p-2 hover:bg-navy-700 rounded text-left transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-cinered-light"><Table size={14}/> {table.name}</span>
                  <span className="text-xs text-slate-500">{expandedTables[table.name] ? '▼' : '▶'}</span>
                </button>
                
                {expandedTables[table.name] && (
                  <div className="ml-6 mt-1 space-y-1 pl-2 border-l border-navy-600">
                    {table.columns.map(col => (
                      <div key={col.name} className="flex items-center justify-between py-1 pr-2 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          {col.pk === 1 ? <Key size={12} className="text-yellow-500" title="Primary Key"/> : 
                           col.fk ? <LinkIcon size={12} className="text-blue-400" title={`Foreign Key to ${col.fk.table}(${col.fk.to})`}/> : 
                           <div className="w-3"></div>}
                          <span className={col.pk ? 'font-bold text-white' : 'text-slate-300'}>{col.name}</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">{col.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="border-t border-navy-700 bg-navy-900 h-1/3 flex flex-col">
            <div className="px-4 py-2 text-sm font-medium text-slate-400 border-b border-navy-700">Recent Queries</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {history.map((h, i) => (
                <div 
                  key={i} 
                  onClick={() => setQuery(h.query)}
                  className={`p-2 rounded text-xs cursor-pointer truncate font-mono border-l-2 ${h.success ? 'border-green-500 hover:bg-green-900/20' : 'border-red-500 hover:bg-red-900/20'} bg-navy-800`}
                  title={h.query}
                >
                  <span className="text-slate-500 mr-2">{h.time}</span>
                  <span className="text-slate-300">{h.query}</span>
                </div>
              ))}
              {history.length === 0 && <div className="text-center text-slate-500 text-sm mt-4">No history</div>}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={resetModal} onClose={() => setResetModal(false)} title="Reset Database">
        <div className="space-y-4">
          <div className="p-4 bg-red-900/20 border border-red-900 text-red-200 rounded-lg flex gap-3">
            <AlertCircle className="shrink-0 mt-0.5" />
            <p><strong>Warning:</strong> This will drop all tables and recreate them with the default seed data. All your custom data and modifications will be lost.</p>
          </div>
          <p className="text-slate-300">Are you sure you want to proceed?</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setResetModal(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
            <button onClick={resetDB} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg">Yes, Reset DB</button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SqlPlayground;


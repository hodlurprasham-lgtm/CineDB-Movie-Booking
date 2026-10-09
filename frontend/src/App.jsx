import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Movies from './pages/Movies';
import Booking from './pages/Booking';
import SqlPlayground from './pages/SqlPlayground';
import TableManager from './pages/TableManager';
import Learn from './pages/Learn';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-navy-900 text-slate-200">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="p-8 min-h-screen">
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/sql" element={<SqlPlayground />} />
            <Route path="/tables" element={<TableManager />} />
            <Route path="/learn" element={<Learn />} />
          </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;

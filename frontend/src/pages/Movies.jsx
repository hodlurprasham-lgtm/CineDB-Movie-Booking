import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', genre: '', language: '', duration_minutes: '', 
    release_date: '', rating: '', description: '', poster_color: '#1e2a45'
  });

  const fetchMovies = async () => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/movies`;
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedGenre) params.append('genre', selectedGenre);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setMovies(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load movies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [gRes, lRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/movies/genres`).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/movies/languages`).then(r => r.json())
      ]);
      setGenres(gRes || []);
      setLanguages(lRes || []);
    } catch (err) {
      console.error('Failed to load filters', err);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMovies();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedGenre]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleOpenModal = (movie = null) => {
    if (movie) {
      setCurrentMovie(movie);
      setFormData(movie);
    } else {
      setCurrentMovie(null);
      setFormData({
        title: '', genre: '', language: '', duration_minutes: '', 
        release_date: '', rating: '', description: '', poster_color: '#1e2a45'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = currentMovie ? 'PUT' : 'POST';
    const url = currentMovie 
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/movies/${currentMovie.movie_id}` 
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/movies`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Operation failed');
      
      showToast(currentMovie ? 'Movie updated successfully' : 'Movie added successfully');
      setIsModalOpen(false);
      fetchMovies();
      fetchFilters();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/movies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Movie deleted successfully');
      fetchMovies();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Movies</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-cinered hover:bg-cinered-light text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} /> Add Movie
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-navy-800 p-4 rounded-xl border border-navy-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search movies..." 
            className="w-full bg-navy-900 border border-navy-700 text-white rounded-lg pl-10 pr-4 py-2 focus:border-cinered focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <select 
            className="w-full bg-navy-900 border border-navy-700 text-white rounded-lg pl-10 pr-4 py-2 focus:border-cinered focus:outline-none appearance-none"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="">All Genres</option>
            {genres.map((g, i) => <option key={i} value={g.genre}>{g.genre}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map(movie => (
            <div key={movie.movie_id} className="bg-navy-800 rounded-xl overflow-hidden border border-navy-700 group hover:border-navy-500 transition-colors">
              <div 
                className="h-48 relative flex items-end p-4"
                style={{ background: `linear-gradient(to bottom, transparent, #0a0e1a), ${movie.poster_color || '#1e2a45'}` }}
              >
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(movie)} className="p-2 bg-black/50 hover:bg-black text-white rounded-full backdrop-blur-sm"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(movie.movie_id)} className="p-2 bg-black/50 hover:bg-cinered text-white rounded-full backdrop-blur-sm"><Trash2 size={16} /></button>
                </div>
                <h3 className="text-xl font-bold text-white leading-tight">{movie.title}</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 bg-navy-700 text-slate-300 rounded text-xs">{movie.genre}</span>
                  <span className="text-yellow-500 font-medium text-sm flex items-center gap-1">★ {movie.rating}</span>
                </div>
                <div className="text-sm text-slate-400 flex justify-between">
                  <span>{movie.language}</span>
                  <span>{movie.duration_minutes} min</span>
                </div>
              </div>
            </div>
          ))}
          {movies.length === 0 && <div className="col-span-full py-12 text-center text-slate-500">No movies found.</div>}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={currentMovie ? 'Edit Movie' : 'Add New Movie'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
              <input required type="text" className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Genre</label>
              <input required type="text" className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Language</label>
              <input required type="text" className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Duration (mins)</label>
              <input required type="number" className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Rating (0-10)</label>
              <input required type="number" step="0.1" max="10" min="0" className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Release Date</label>
              <input required type="date" className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={formData.release_date} onChange={e => setFormData({...formData, release_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Poster Color</label>
              <div className="flex gap-2">
                <input type="color" className="h-10 w-10 bg-navy-900 border border-navy-700 rounded cursor-pointer" value={formData.poster_color} onChange={e => setFormData({...formData, poster_color: e.target.value})} />
                <input type="text" className="flex-1 bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={formData.poster_color} onChange={e => setFormData({...formData, poster_color: e.target.value})} />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
              <textarea rows="3" className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-cinered hover:bg-cinered-light text-white rounded-lg">{currentMovie ? 'Update Movie' : 'Save Movie'}</button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Movies;

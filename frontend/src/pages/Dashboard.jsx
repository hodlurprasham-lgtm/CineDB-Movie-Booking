import React, { useState, useEffect } from 'react';
import { Film, MapPin, Ticket, IndianRupee } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import { formatCurrency } from '../utils/currency';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [popularMovies, setPopularMovies] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, popularRes, revenueRes, bookingsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/stats`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/popular-movies`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/revenue-chart`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/recent-bookings`).then(r => r.json())
        ]);
        
        setStats(statsRes);
        setPopularMovies(popularRes || []);
        setRevenueData(revenueRes || []);
        setRecentBookings(bookingsRes || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Movies" value={stats?.total_movies || 0} icon={Film} />
        <StatCard title="Total Theatres" value={stats?.total_theatres || 0} icon={MapPin} />
        <StatCard title="Total Bookings" value={stats?.total_bookings || 0} icon={Ticket} />
        <StatCard title="Total Revenue" value={formatCurrency(stats?.total_revenue || 0, 0)} icon={IndianRupee} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-navy-800 rounded-xl p-6 border border-navy-700">
          <h2 className="text-xl font-semibold text-white mb-6">Revenue by Theatre</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="name" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#21262d', color: '#e2e8f0' }}
                  itemStyle={{ color: '#e50914' }}
                  formatter={(value) => [formatCurrency(value, 0), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#e50914" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
          <h2 className="text-xl font-semibold text-white mb-6">Popular Movies</h2>
          <div className="space-y-4">
            {popularMovies.map((movie, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-navy-900 border border-navy-700">
                <div>
                  <h3 className="font-medium text-white">{movie.name}</h3>
                  <p className="text-xs text-slate-400"></p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-cinered">{movie.bookings}</span>
                  <span className="text-xs text-slate-500">bookings</span>
                </div>
              </div>
            ))}
            {popularMovies.length === 0 && <p className="text-slate-500 text-center py-4">No data available</p>}
          </div>
        </div>
      </div>

      <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
        <h2 className="text-xl font-semibold text-white mb-6">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-navy-700 text-slate-400">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Movie</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.booking_id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="py-3 text-slate-300">#{booking.booking_id}</td>
                  <td className="py-3 font-medium text-white">{booking.customer_name}</td>
                  <td className="py-3 text-slate-300">{booking.movie_title}</td>
                  <td className="py-3 text-slate-300">{booking.show_date}</td>
                  <td className="py-3 font-medium">{formatCurrency(booking.total_amount)}</td>
                  <td className="py-3"><Badge status={booking.booking_status} /></td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr><td colSpan="6" className="py-8 text-center text-slate-500">No recent bookings</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currency';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import Toast from '../components/ui/Toast';
import { Calendar, Clock, MapPin, CheckCircle, CreditCard } from 'lucide-react';

const Booking = () => {
  const [step, setStep] = useState(1);
  const [shows, setShows] = useState([]);
  const [seats, setSeats] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Booking State
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ customer_id: '', name: '', email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [bookingResult, setBookingResult] = useState(null);

  const fetchShows = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/shows`);
      setShows(await res.json() || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings`);
      setHistory(await res.json() || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchShows();
    fetchHistory();
  }, []);

  const handleSelectShow = async (show) => {
    setSelectedShow(show);
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/shows/${show.show_id}/seats`);
      setSeats(await res.json() || []);
      setStep(2);
      setSelectedSeats([]);
    } catch (e) {
      setToast({ message: 'Failed to load seats', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.is_booked) return;
    if (selectedSeats.includes(seat.seat_id)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seat.seat_id));
    } else {
      setSelectedSeats([...selectedSeats, seat.seat_id]);
    }
  };

  const proceedToCustomer = async () => {
    if (selectedSeats.length === 0) {
      setToast({ message: 'Please select at least one seat', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers`);
      setCustomers(await res.json() || []);
      setStep(3);
    } catch (e) {
      setToast({ message: 'Failed to load customers', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (e) => {
    const id = e.target.value;
    if (!id) {
      setCustomerInfo({ customer_id: '', name: '', email: '', phone: '' });
      return;
    }
    const c = customers.find(x => x.customer_id.toString() === id);
    if (c) {
      setCustomerInfo({ customer_id: c.customer_id, name: c.name, email: c.email, phone: c.phone });
    }
  };

  const confirmBooking = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setToast({ message: 'Please fill all customer details', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      let customerId = customerInfo.customer_id;
      // If no existing customer id, create or find by email
      if (!customerId) {
        const cRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: customerInfo.name, email: customerInfo.email, phone: customerInfo.phone })
        });
        const cData = await cRes.json();
        if (cRes.status === 409) {
          // Email already exists - find the existing customer id
          const allCRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers`);
          const allCustomers = await allCRes.json();
          const existing = allCustomers.find(c => c.email === customerInfo.email);
          if (existing) customerId = existing.customer_id;
          else throw new Error('Customer email already exists. Please select existing customer.');
        } else if (!cRes.ok) {
          throw new Error(cData.error || 'Failed to create customer');
        } else {
          customerId = cData.customer_id;
        }
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          show_id: selectedShow.show_id,
          seat_ids: selectedSeats,
          payment_method: paymentMethod
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      
      setBookingResult(data);
      setStep(4);
      fetchHistory();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${id}/cancel`, { method: 'PUT' });
      if (!res.ok) throw new Error('Cancellation failed');
      setToast({ message: 'Booking cancelled successfully', type: 'success' });
      fetchHistory();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedShow(null);
    setSelectedSeats([]);
    setBookingResult(null);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Book Tickets</h1>

      {/* Wizard Header */}
      <div className="flex items-center justify-between bg-navy-800 p-4 rounded-xl border border-navy-700">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-cinered text-white' : 'bg-navy-900 text-slate-500'}`}>
              {s}
            </div>
            <span className={`ml-2 hidden md:block ${step >= s ? 'text-white' : 'text-slate-500'}`}>
              {s === 1 ? 'Select Show' : s === 2 ? 'Select Seats' : s === 3 ? 'Details' : 'Confirm'}
            </span>
            {s < 4 && <div className="w-12 h-1 mx-4 bg-navy-700"></div>}
          </div>
        ))}
      </div>

      {/* Step 1: Shows */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Available Shows</h2>
          {loading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shows.map(show => (
                <div key={show.show_id} onClick={() => handleSelectShow(show)} className="bg-navy-800 p-5 rounded-xl border border-navy-700 hover:border-cinered cursor-pointer transition-colors">
                  <h3 className="font-bold text-lg text-white mb-2">{show.movie_title}</h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2"><MapPin size={16} className="text-cinered" /> {show.theatre_name} - {show.screen_name}</div>
                    <div className="flex items-center gap-2"><Calendar size={16} className="text-cinered" /> {show.show_date}</div>
                    <div className="flex items-center gap-2"><Clock size={16} className="text-cinered" /> {show.show_time}</div>
                    <div className="flex items-center gap-2 text-green-400 font-medium">{formatCurrency(show.ticket_price)} per seat</div>
                  </div>
                </div>
              ))}
              {shows.length === 0 && <p className="text-slate-500">No shows available.</p>}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Seats */}
      {step === 2 && selectedShow && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-navy-800 p-4 rounded-xl border border-navy-700">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedShow.movie_title}</h2>
              <p className="text-sm text-slate-400">{selectedShow.theatre_name} | {selectedShow.show_date} {selectedShow.show_time}</p>
            </div>
            <button onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-white">Change Show</button>
          </div>

          <div className="bg-navy-800 p-8 rounded-xl border border-navy-700 flex flex-col items-center">
            <div className="w-full max-w-2xl bg-navy-600 h-8 rounded-t-3xl mb-8 flex items-center justify-center text-xs text-slate-300 tracking-[0.5em] shadow-[0_10px_20px_rgba(229,9,20,0.1)]">SCREEN</div>
            
            {loading ? <LoadingSpinner /> : (
              <div className="grid grid-cols-10 gap-2 mb-8">
                {seats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.seat_id);
                  let bg = 'bg-slate-700 hover:bg-slate-600 cursor-pointer';
                  if (seat.is_booked) bg = 'bg-navy-900 text-navy-700 cursor-not-allowed opacity-50';
                  else if (isSelected) bg = 'bg-cinered text-white shadow-[0_0_10px_rgba(229,9,20,0.5)]';
                  
                  return (
                    <div 
                      key={seat.seat_id} 
                      onClick={() => handleSeatClick(seat)}
                      className={`w-8 h-8 rounded-t-lg flex items-center justify-center text-xs font-medium transition-all ${bg}`}
                      title={`${seat.seat_row}${seat.seat_number}`}
                    >
                      {seat.seat_number}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-700"></div> Available</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-cinered"></div> Selected</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-navy-900 border border-navy-700"></div> Booked</div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-navy-800 p-4 rounded-xl border border-navy-700">
            <div className="text-white">
              Selected: <span className="font-bold">{selectedSeats.length}</span> seats
              <span className="mx-4 text-slate-600">|</span>
              Total: <span className="font-bold text-green-400">{formatCurrency(selectedSeats.length * selectedShow.ticket_price)}</span>
            </div>
            <button onClick={proceedToCustomer} className="px-6 py-2 bg-cinered hover:bg-cinered-light text-white rounded-lg font-medium">Proceed</button>
          </div>
        </div>
      )}

      {/* Step 3: Customer Details */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Customer Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Existing Customer?</label>
              <select onChange={handleCustomerSelect} className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white">
                <option value="">-- Select or enter new details below --</option>
                {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name} ({c.email})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-navy-700">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                <input type="text" className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value, customer_id: ''})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input type="email" className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value, customer_id: ''})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Phone</label>
                <input type="tel" className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value, customer_id: ''})} />
              </div>
            </div>

            <div className="pt-4 border-t border-navy-700">
              <label className="block text-sm font-medium text-slate-400 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['UPI', 'Card', 'NetBanking', 'Cash'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-3 border rounded-lg flex items-center justify-center gap-2 ${paymentMethod === m ? 'border-cinered bg-cinered/10 text-white' : 'border-navy-600 text-slate-400 hover:border-slate-500'}`}
                  >
                    <CreditCard size={16} /> {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button onClick={() => setStep(2)} className="px-6 py-2 text-slate-400 hover:text-white">Back</button>
            <button onClick={confirmBooking} disabled={loading} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium flex items-center gap-2">
              {loading ? 'Processing...' : 'Confirm & Pay ' + formatCurrency(selectedSeats.length * selectedShow.ticket_price)}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && bookingResult && (
        <div className="max-w-md mx-auto text-center space-y-6 bg-navy-800 p-8 rounded-xl border border-green-900 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
          <CheckCircle size={64} className="text-green-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
            <p className="text-slate-400">Your booking ID is <span className="text-white font-mono bg-navy-900 px-2 py-1 rounded">#{bookingResult.booking_id}</span></p>
          </div>
          <div className="bg-navy-900 p-4 rounded-lg text-left text-sm space-y-2 text-slate-300">
            <div className="flex justify-between"><span>Movie:</span> <span className="font-medium text-white">{selectedShow.movie_title}</span></div>
            <div className="flex justify-between"><span>Time:</span> <span>{selectedShow.show_date} {selectedShow.show_time}</span></div>
            <div className="flex justify-between"><span>Seats:</span> <span>{selectedSeats.length} ticket(s)</span></div>
            <div className="flex justify-between"><span>Amount Paid:</span> <span className="text-green-400 font-medium">{formatCurrency(selectedSeats.length * selectedShow.ticket_price)}</span></div>
          </div>
          <button onClick={resetWizard} className="w-full px-6 py-3 bg-navy-700 hover:bg-navy-600 text-white rounded-lg font-medium">Book Another Ticket</button>
        </div>
      )}

      {/* Booking History */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6">Booking History</h2>
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-navy-900/50">
                <tr className="text-slate-400">
                  <th className="p-4 font-medium">Booking ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Movie & Show</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/50">
                {history.map((h) => (
                  <tr key={h.booking_id} className="hover:bg-navy-700/30">
                    <td className="p-4 text-slate-300 font-mono text-sm">#{h.booking_id}</td>
                    <td className="p-4 font-medium text-white">{h.customer_name}</td>
                    <td className="p-4 text-slate-300">
                      <div>{h.movie_title}</div>
                      <div className="text-xs text-slate-500">{h.show_date} {h.show_time}</div>
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(h.total_amount)}</td>
                    <td className="p-4"><Badge status={h.booking_status} /></td>
                    <td className="p-4">
                      {h.booking_status === 'Confirmed' && (
                        <button onClick={() => cancelBooking(h.booking_id)} className="text-red-400 hover:text-red-300 text-sm font-medium">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-500">No booking history found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Booking;



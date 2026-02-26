"use client"
import { useState, useEffect } from 'react';
import apiClient, { adminAPI } from '@/lib/api';
import "../styles/admin.css";
import AdminBookingModal from '@/components/AdminBookingModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingBooking, setEditingBooking] = useState(null);
  const [status, setStatus] = useState('');
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'room', 'event'

  /* Helper to Safely Format Date */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  /* Sort Config State */
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('jwtToken');
      if (!token) return;

      const data = await adminAPI.getAllBookings();
      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        console.error("Invalid bookings data received:", data);
        setBookings([]);
      }
    } catch (error) {
      console.error(error);
      setBookings([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setStatus(booking.status);
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('jwtToken') || localStorage.getItem('adminToken');
      
      const endpoint = editingBooking.type === 'event' 
        ? `/halls/bookings/${editingBooking._id}` 
        : `/bookings/${editingBooking._id}`;
        
      const res = await apiClient.put(endpoint, { status });

      if (res.status === 200) {
        // alert("Booking Updated!"); // Removed for cleaner UX
        setEditingBooking(null);
        fetchBookings();
      } else {
        alert("Update Failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* Sorting Logic */
  const sortedBookings = [...bookings].sort((a, b) => {
    let aValue, bValue;

    switch (sortConfig.key) {
      case 'room':
        aValue = a.type === 'event' ? (a.hall?.name || '') : (a.room?.name || '');
        bValue = b.type === 'event' ? (b.hall?.name || '') : (b.room?.name || '');
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      
      case 'date': // Check-in Date or Event Date
        aValue = a.type === 'event' ? new Date(a.eventDate).getTime() : new Date(a.checkIn).getTime();
        bValue = b.type === 'event' ? new Date(b.eventDate).getTime() : new Date(b.checkIn).getTime();
        break;
      
      case 'time': // Booking Time (Created At)
        aValue = a.createdAt ? new Date(a.createdAt).getTime() : parseInt(a._id.substring(0, 8), 16) * 1000;
        bValue = b.createdAt ? new Date(b.createdAt).getTime() : parseInt(b._id.substring(0, 8), 16) * 1000;
        break;
      
      case 'name':
        aValue = a.guestDetails?.fullName || a.user?.name || '';
        bValue = b.guestDetails?.fullName || b.user?.name || '';
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);

      default:
        return 0;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredBookings = sortedBookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.type === activeTab;
  });
  
  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ loop: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="admin-header flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-800">Manage Bookings</h1>
           <p className="text-gray-500 mt-1">View and manage all hotel reservations</p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all shadow-md text-sm font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Create New Booking
        </motion.button>
      </div>

      {/* Sorting & Tabs Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-4 mb-8 bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
      >
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-100 pb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all' 
                ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setActiveTab('room')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'room' 
                ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            Room Bookings
          </button>
          <button
            onClick={() => setActiveTab('event')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'event' 
                ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            Event Bookings
          </button>
        </div>

        {/* Sorting Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
             <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
             <span className="text-gray-600 font-medium text-sm">Sort By:</span>
          </div>
        
        <select 
          value={sortConfig.key} 
          onChange={(e) => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
          className="p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 hover:bg-white focus:bg-white transition-colors focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
        >
          <option value="time">Booking Time</option>
          <option value="date">Check-in Date</option>
          <option value="name">Guest Name</option>
          <option value="room">Room Type</option>
        </select>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
          className="flex items-center gap-2 px-4 py-2 border border-blue-100 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
        >
          {sortConfig.direction === 'asc' ? (
            <>
              <span>Ascending</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path></svg>
            </>
          ) : (
            <>
              <span>Descending</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path></svg>
            </>
          )}
        </motion.button>
        
        <div className="ml-auto text-sm text-gray-400">
           Showing {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
        </div>
        </div>
      </motion.div>

      <AdminBookingModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onBookingCreated={() => {
          fetchBookings();
          setIsCreateModalOpen(false);
        }}
      />

      <div className="table-container bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="custom-table w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Guest</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking Item</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <AnimatePresence>
              {filteredBookings.map((booking, index) => (
                <motion.tr 
                  key={booking._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">#{booking._id.slice(-6)}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{booking.guestDetails?.fullName || booking.user?.name}</div>
                    <div className="text-xs text-gray-500">{booking.guestDetails?.email || booking.user?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.type === 'event' ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}>
                        {booking.type === 'event' ? 'Event: ' : 'Room: '} {booking.type === 'event' ? booking.hall?.name : booking.room?.name}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {booking.type === 'event' ? (
                      <div className="flex flex-col">
                        <span>Date: {formatDate(booking.eventDate)}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                         <span>In: {formatDate(booking.checkIn)}</span>
                         <span className="text-gray-400 text-xs">Out: {formatDate(booking.checkOut)}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                       className={`status-badge px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                       ${['confirmed', 'completed'].includes(booking.status) || booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                         ['pending', 'unpaid'].includes(booking.status) || booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                         booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                         booking.status === 'checked-in' ? 'bg-purple-100 text-purple-800' :
                         booking.status === 'checked-out' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{booking.pricing?.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(booking)} 
                      className="text-orange-600 hover:text-orange-900 font-medium bg-orange-50 px-3 py-1 rounded-md border border-orange-100 group-hover:bg-orange-100 transition-colors"
                    >
                      Edit
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filteredBookings.length === 0 && (
               <tr className="text-center py-10">
                  <td colSpan="7" className="py-12 text-gray-400">
                     <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p>No bookings found matching criteria.</p>
                     </div>
                  </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editingBooking && (
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800">Edit Booking</h2>
                   <div className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-mono">#{editingBooking._id.slice(-6)}</div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Update Status</label>
                    <div className="relative">
                       <select 
                         value={status} 
                         onChange={(e) => setStatus(e.target.value)} 
                         className="w-full p-3 pl-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                       >
                         <option value="confirmed">Confirmed</option>
                         <option value="pending">Pending</option>
                         <option value="checked-in">Checked In</option>
                         <option value="checked-out">Checked Out</option>
                         <option value="cancelled">Cancelled</option>
                       </select>
                       <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                       </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Guest Name</span>
                      <span className="font-semibold text-gray-900">{editingBooking.guestDetails?.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Room Type</span>
                      <span className="font-semibold text-gray-900">{editingBooking.room?.name}</span>
                    </div>
                    <div className="h-px bg-blue-100 my-2"></div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Total Price</span>
                      <span className="font-bold text-lg text-blue-600 font-mono">₹{editingBooking.pricing?.total}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    onClick={() => setEditingBooking(null)} 
                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdate} 
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors font-medium shadow-md shadow-orange-200 text-sm"
                  >
                    Save Changes
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

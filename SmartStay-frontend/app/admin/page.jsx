"use client"

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import AdminCharts from './components/AdminCharts'
import AdminCarousel from './components/AdminCarousel'

import FlipCard from './components/FlipCard'
import { motion } from 'framer-motion'

export default function AdminDashboard() {

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('jwtToken');
        if (!token) {
          console.error("No admin token found, redirecting...");
          // Optional: Redirect to login or show error
          return; 
        }

        const data = await adminAPI.getStats()
        setStats(data)
      } catch (error) {
        console.error("Admin Stats Fetch Error:", error.message)
        // If unauthorized, the API interceptor should handle it, but we can also set local error state
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  )

  if (!stats) return (
    <div className="flex flex-col justify-center items-center h-screen text-neutral-400">
      <h2 className="text-2xl font-bold mb-4 text-neutral-200">Unable to load dashboard data</h2>
      <p className="mb-6">Please verify the backend server is running on port 5000.</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
      >
        Retry Connection
      </button>
    </div>
  )

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans selection:bg-orange-500/30">
      
      {/* =======================
          LIVE BACKGROUND LAYER 
          ======================= */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        
        {/* Isolate Texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-neutral-950/40 opacity-70"></div>

        {/* Animated Blobs */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] will-change-transform"
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-orange-900/20 rounded-full blur-[120px] will-change-transform"
        />
        <motion.div 
          animate={{ 
             scale: [1, 1.1, 1],
             opacity: [0.1, 0.3, 0.1] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[30%] w-[800px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] will-change-transform"
        />
      </div>

      {/* =======================
          CONTENT LAYER (z-10)
          ======================= */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto"
      >
        
        {/* 1. Hero Carousel */}
        <motion.div variants={itemVariants}>
          <AdminCarousel />
        </motion.div>

        <motion.h2 
          variants={itemVariants}
          className="text-3xl font-bold mb-8 text-neutral-100 flex items-center gap-2"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400">
            Dashboard Overview
          </span>
        </motion.h2>




        {/* 2. Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, color: 'from-green-500/20 to-green-900/5', border: 'border-green-500/30', text: 'text-green-400' },
            { label: 'Total Bookings', value: stats.bookingsCount, color: 'from-blue-500/20 to-blue-900/5', border: 'border-blue-500/30', text: 'text-blue-400' },
            { label: 'Total Users', value: stats.usersCount, color: 'from-orange-500/20 to-orange-900/5', border: 'border-orange-500/30', text: 'text-orange-400' }
          ].map((stat, index) => (
            <div key={index} className="h-40"> {/* Fixed height for flip card */}
              <FlipCard
                className="h-full"
                frontContent={
                  <div className={`p-6 rounded-xl shadow-lg backdrop-blur-md bg-gradient-to-br ${stat.color} border ${stat.border} h-full flex flex-col justify-center items-center`}>
                    <h3 className={`text-sm uppercase tracking-wider font-semibold opacity-90 ${stat.text}`}>{stat.label}</h3>
                    <p className="text-xs text-neutral-400 mt-2">Hover to reveal</p>
                  </div>
                }
                backContent={
                  <div className={`p-6 rounded-xl shadow-lg backdrop-blur-md bg-neutral-900 border ${stat.border} h-full flex flex-col justify-center items-center`}>
                    <h3 className={`text-sm uppercase tracking-wider font-semibold opacity-70 mb-2 ${stat.text}`}>{stat.label}</h3>
                    <p className="text-4xl font-bold text-white">{stat.value}</p>
                  </div>
                }
              />
            </div>
          ))}
        </div>

        {/* 3. Charts Section */}
        <motion.div 
          initial="visible" 
          animate="visible"
          variants={itemVariants}
          className="min-h-[400px]" // Force height to ensure visibility
        >
          <AdminCharts 
            roomMonthlyRevenue={stats.roomMonthlyRevenue} 
            eventMonthlyRevenue={stats.eventMonthlyRevenue}
            roomStatusCounts={stats.roomStatusCounts}
            eventStatusCounts={stats.eventStatusCounts} 
          />
        </motion.div>

        {/* 4. Recent Bookings Table */}
        <motion.div 
          variants={itemVariants}
          className="bg-neutral-900/50 backdrop-blur-md rounded-xl shadow-lg border border-white/10 overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h3 className="text-xl font-bold text-neutral-100">Recent Bookings</h3>
            <button className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">View All</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-neutral-400 border-b border-white/5">
                <tr>
                  <th className="p-4 font-semibold">Guest</th>
                  <th className="p-4 font-semibold">Booking Item</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recentBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-neutral-200">{booking.guestDetails?.fullName || booking.user?.name}</div>
                      <div className="text-sm text-neutral-500">{booking.user?.email || booking.guestDetails?.email}</div>
                    </td>
                    <td className="p-4 text-neutral-300">
                      <div className="flex items-center gap-2">
                        {booking.type === 'event' ? (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs border border-blue-500/30">Event</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/30">Room</span>
                        )}
                        <span>{booking.type === 'event' ? (booking.hall?.name || 'Unknown Hall') : (booking.room?.name || 'Unknown Room')}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide
                        ${['confirmed', 'completed'].includes(booking.status) || booking.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-300 border border-green-500/20' : 
                          ['pending', 'unpaid'].includes(booking.status) || booking.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/20' : 
                          'bg-gray-500/20 text-gray-300 border border-gray-500/20'}`}>
                        {booking.status || booking.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-400">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-neutral-200">
                      ₹{booking.pricing?.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.recentBookings.length === 0 && (
               <div className="p-8 text-center text-neutral-500">No bookings found.</div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}


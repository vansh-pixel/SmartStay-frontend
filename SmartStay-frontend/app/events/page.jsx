"use client"

import { useState, useEffect } from "react"
import { hallAPI } from "@/lib/api"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import HallBookingModal from "@/components/HallBookingModal"
import "@/styles/events.css"
import { motion } from "framer-motion"

export default function EventsPage() {
  const [halls, setHalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHall, setSelectedHall] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchHalls()
  }, [])

  const fetchHalls = async () => {
    try {
      const data = await hallAPI.getAll()
      setHalls(data)
    } catch (error) {
      console.error("Failed to fetch halls:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookClick = (hall) => {
    setSelectedHall(hall)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/30">
      <Navbar />
      
      <main className="events-container">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="events-header"
        >
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-orange-500 font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
          >
            Memorable Experiences
          </motion.span>
          <h1>Events & Banquets</h1>
          <p>Elevate your celebrations at SmartStay. From grand weddings to professional corporate conventions, we provide bespoke spaces tailored to your vision.</p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-orange-500/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
            </div>
            <p className="text-muted-foreground font-medium animate-pulse">Loading luxury spaces...</p>
          </div>
        ) : (
          <div className="halls-grid">
            {halls.map((hall, index) => (
              <motion.div
                key={hall.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  ease: [0.215, 0.61, 0.355, 1] 
                }}
                className="hall-card"
              >
                <div className="hall-image">
                  <img src={hall.image} alt={hall.name} loading="lazy" />
                </div>
                <div className="hall-info">
                  <span className="hall-type">{hall.type}</span>
                  <h2>{hall.name}</h2>
                  <p className="hall-desc">{hall.description}</p>
                  
                  <div className="hall-meta">
                    <div className="meta-item">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                      </svg>
                      {hall.capacity} Guest Capacity
                    </div>
                  </div>

                  <div className="mt-auto flex justify-between items-end gap-6">
                    <div className="hall-pricing">
                      <span className="price-label">Starting from</span>
                      <span className="price">{hall.priceDisplay}</span>
                    </div>
                    <button 
                      className="book-btn flex-1"
                      onClick={() => handleBookClick(hall)}
                    >
                      Plan Event
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {selectedHall && (
        <HallBookingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          hall={selectedHall} 
        />
      )}
    </div>
  )
}

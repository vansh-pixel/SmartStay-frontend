"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI } from '@/lib/api'

export default function AdminAIAssistant({ onApplyAICommand }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I can help you filter/sort bookings, check availability for any date, or lookup specific guest details and invoices. Try saying "Is there a room on Friday?" or "Find Vansh\'s booking".' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setIsLoading(true)

    try {
      const response = await adminAPI.adminChat(userMessage)
      
      // If it's a chat message, just display it
      if (response.action === "chat") {
        setMessages(prev => [...prev, { role: 'ai', text: response.message }])
      } else if (response.action === "lookup") {
        setMessages(prev => [...prev, { role: 'ai', text: response.message, bookings: response.bookings }])
      } else {
        // Use the AI's provided message or a fallback
        const feedback = response.message || `Got it! Applying ${response.action} command.`
        setMessages(prev => [...prev, { role: 'ai', text: feedback }])
        // Trigger parent callback to update the table
        if (onApplyAICommand) {
          onApplyAICommand(response)
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error connecting to the server.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const downloadInvoice = (booking) => {
    const shortId = booking._id?.toString().slice(-6).toUpperCase() || 'N/A';
    const guestName = booking.guestDetails?.fullName || 'N/A';
    const guestEmail = booking.guestDetails?.email || 'N/A';
    const guestPhone = booking.guestDetails?.phone || 'N/A';
    const checkIn = new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const checkOut = new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const nights = booking.pricing?.nights || 1;
    const total = booking.pricing?.total || 0;
    const roomName = booking.room?.name || 'N/A';
    const status = booking.status || 'confirmed';

    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #ff8c42; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #ff8c42; margin: 0; font-size: 32px; }
    .booking-id { background: #ff8c42; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; font-size: 18px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
    .row span:first-child { color: #666; }
    .row span:last-child { color: #1a1a1a; font-weight: 600; }
    .total-row { border-top: 3px solid #ff8c42; margin-top: 15px; padding-top: 15px; font-size: 20px; font-weight: bold; }
    .total-row span:last-child { color: #ff8c42; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; color: #666; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600; text-transform: uppercase;}
    .status-confirmed { background: #d4edda; color: #155724; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    .status-completed { background: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <div class="header">
    <h1>HOTEL SMARTSTAY</h1>
    <div class="booking-id">Booking ID: \${shortId}</div>
    <p style="margin-top: 10px; color: #666;">Date: \${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <h2>Booking Status</h2>
    <div class="row">
      <span>Status:</span>
      <span class="status-badge status-\${status.toLowerCase()}">\${status}</span>
    </div>
  </div>

  <div class="section">
    <h2>Guest Details</h2>
    <div class="row"><span>Name:</span><span>\${guestName}</span></div>
    <div class="row"><span>Email:</span><span>\${guestEmail}</span></div>
    <div class="row"><span>Phone:</span><span>\${guestPhone}</span></div>
  </div>

  <div class="section">
    <h2>Booking Details</h2>
    <div class="row"><span>Room:</span><span>\${roomName}</span></div>
    <div class="row"><span>Check-in:</span><span>\${checkIn}</span></div>
    <div class="row"><span>Check-out:</span><span>\${checkOut}</span></div>
    <div class="row"><span>Number of Nights:</span><span>\${nights}</span></div>
  </div>

  <div class="section">
    <h2>Payment Summary</h2>
    <div class="row"><span>Room Charges (\${nights} nights):</span><span>₹\${(total * 0.75).toFixed(2)}</span></div>
    <div class="row"><span>Service Fee:</span><span>₹20.00</span></div>
    <div class="row"><span>Taxes (18%):</span><span>₹\${(total * 0.15).toFixed(2)}</span></div>
    <div class="row total-row"><span>Total Amount:</span><span>₹\${total.toFixed(2)}</span></div>
  </div>

  <div class="footer">
    <p><strong>Thank you for choosing Hotel SmartStay!</strong></p>
    <p>For any queries, please contact us at support@smartstay.com</p>
  </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  return (
    <>
      <motion.div 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          boxShadow: ['0px 0px 0px 0px rgba(249,115,22,0.4)', '0px 0px 0px 15px rgba(249,115,22,0)'],
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-orange-600 to-orange-400 rounded-full flex items-center justify-center cursor-pointer shadow-xl z-50 text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.svg 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </motion.svg>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[450px] bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 shrink-0 flex justify-between items-center text-white relative overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-white/10"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <div className="flex items-center gap-2 relative z-10">
                <motion.svg 
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                </motion.svg>
                <h3 className="font-semibold tracking-wide flex items-center gap-2">
                  Admin AI
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                </h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-white/80 transition-colors text-xl leading-none">&times;</button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar tracking-wide" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`max-w-[85%] rounded-xl p-3 text-sm ${msg.role === 'ai' ? 'bg-neutral-800 text-neutral-200 self-start border border-white/5 shadow-sm rounded-tl-none' : 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-50 self-end border border-orange-500/30 rounded-tr-none shadow-[0_0_10px_rgba(249,115,22,0.1)]'}`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.bookings && msg.bookings.length > 0 && (
                      <div className="mt-3 flex flex-col gap-3">
                        {msg.bookings.map(b => (
                          <div key={b._id} className="bg-neutral-900 justify-start p-3 rounded-lg border border-white/10 flex flex-col gap-1 text-xs">
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-orange-400 text-sm">{b.guestDetails?.fullName}</span>
                              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white/70 uppercase tracking-wider">{b.status}</span>
                            </div>
                            <p className="text-neutral-400">Email: {b.guestDetails?.email}</p>
                            <p className="text-neutral-400">Phone: {b.guestDetails?.phone || 'N/A'}</p>
                            <div className="h-px bg-white/10 my-1 w-full" />
                            <p className="text-neutral-300">Room: <span className="text-neutral-100">{b.room?.name || 'N/A'}</span></p>
                            <p className="text-neutral-300">Dates: <span className="text-neutral-100">{new Date(b.checkIn).toLocaleDateString()} to {new Date(b.checkOut).toLocaleDateString()}</span></p>
                            <p className="text-neutral-300 font-medium mt-1">Total Paid: <span className="text-emerald-400">₹{b.pricing?.total}</span></p>
                            
                            <button 
                              onClick={() => downloadInvoice(b)}
                              className="mt-2 w-full bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-500/30 transition-colors py-1.5 rounded flex items-center justify-center gap-1.5"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              Get Invoice
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-neutral-800 text-neutral-400 self-start rounded-xl rounded-tl-none p-3 text-sm border border-white/5 flex gap-1.5 items-center"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      className="w-1.5 h-1.5 bg-orange-400 rounded-full"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-1.5 h-1.5 bg-orange-400 rounded-full"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-1.5 h-1.5 bg-orange-400 rounded-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-neutral-950 border-t border-white/10 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me to filter or sort..."
                  className="w-full bg-neutral-900 border border-white/10 rounded-full py-2.5 pl-4 pr-12 text-sm text-neutral-200 outline-none focus:border-orange-500/50 transition-colors placeholder:text-neutral-500"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 top-1 bottom-1 w-8 bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-700 disabled:text-neutral-400 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-0.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { hallAPI, paymentAPI } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import CheckoutForm from "./CheckoutForm"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function HallBookingModal({ isOpen, onClose, hall }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bookedDates, setBookedDates] = useState([])
  const [clientSecret, setClientSecret] = useState("")
  const [formData, setFormData] = useState({
    eventDate: new Date(),
    eventType: "Ceremony",
    fullName: "",
    email: "",
    phone: "",
    specialRequests: ""
  })

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      setStep(1)
      setSuccess(false)
      setClientSecret("")
      setFormData({
        eventDate: new Date(),
        eventType: "Ceremony",
        fullName: "",
        email: "",
        phone: "",
        specialRequests: ""
      })
      if (hall && hall.id) {
        fetchBookedDates()
      }
    } else {
      document.body.style.overflow = "unset"
    }
  }, [isOpen, hall])

  const fetchBookedDates = async () => {
    try {
      const targetId = hall.id || hall._id;
      const dates = await hallAPI.getBookedDates(targetId)
      setBookedDates(dates.map(d => new Date(d.eventDate)))
    } catch (error) {
      console.error("Failed to fetch booked dates:", error)
    }
  }

  // Check if a date falls on any booked date (normalized to midnight)
  const isDateBooked = (date) => {
    const target = new Date(date).setHours(0,0,0,0)
    return bookedDates.some(booked => new Date(booked).setHours(0,0,0,0) === target)
  }

  const handleNextStep = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const targetId = hall.id || hall._id;
      // 1. Generate Stripe Payment Intent
      const intentData = await paymentAPI.createEventPaymentIntent({
        hallId: targetId,
        pricePerDay: hall.pricePerDay
      })
      
      setClientSecret(intentData.clientSecret)
      setStep(2)
    } catch (error) {
      alert("Failed to initialize payment: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setSuccess(true)
  }

  // Calculate pricing data to pass to CheckoutForm
  const taxes = hall.pricePerDay * 0.18
  const total = hall.pricePerDay + taxes

  const bookingDataPayload = {
    hallId: hall.id,
    eventDate: formData.eventDate,
    eventType: formData.eventType,
    guestDetails: {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone
    },
    pricing: {
      basePrice: hall.pricePerDay,
      taxes: taxes,
      total: total
    }
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#f97316',
        colorBackground: '#171717',
        colorText: '#e5e5e5',
        colorDanger: '#ef4444',
      }
    },
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card text-card-foreground rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl relative border border-border"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors z-10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {success ? (
          <div className="p-12 text-center h-full flex flex-col justify-center items-center">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground mb-8 text-lg">Your reservation for {hall.name} was successful. A confirmation email has been sent.</p>
            <button 
              onClick={onClose}
              className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg hover:shadow-orange-500/40"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row min-h-[600px]">
            {/* Left Side: Detail Overview */}
            <div className="md:w-5/12 bg-slate-900 p-8 text-white relative flex flex-col justify-between">
              <div className="absolute inset-0 opacity-40">
                <img src={hall.image} alt={hall.name} className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10">
                <span className="text-orange-400 font-bold text-sm tracking-widest uppercase mb-4 block">Event Booking</span>
                <h2 className="text-3xl font-bold mt-2 leading-tight mb-6">{hall.name}</h2>
                <div className="flex gap-2">
                   {step === 1 ? (
                     <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md">Step 1: Details</span>
                   ) : (
                     <span className="px-3 py-1 bg-green-500/80 rounded-full text-xs font-semibold backdrop-blur-md">Step 2: Payment</span>
                   )}
                </div>
              </div>
              
              <div className="relative z-10 space-y-4 mt-8">
                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-widest">Selected Date</p>
                    <p className="font-bold text-lg">{formData.eventDate ? formData.eventDate.toLocaleDateString() : 'None'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl font-bold">₹</div>
                  <div>
                    <p className="text-xs text-orange-400 uppercase tracking-widest">Total Amount</p>
                    <p className="font-bold text-lg leading-tight">₹{total.toLocaleString()}</p>
                    <p className="text-xs text-white/50">Incl. ₹{taxes.toLocaleString()} Tax</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Form / Payment */}
            <div className="md:w-7/12 p-8 overflow-y-auto bg-card">
              
              {/* STEP 1: Details Form */}
              {step === 1 && (
                <form onSubmit={handleNextStep} className="space-y-6">
                  <h3 className="text-2xl font-bold">Guest Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Event Date</label>
                      <DatePicker
                        selected={formData.eventDate}
                        onChange={(date) => setFormData({...formData, eventDate: date})}
                        className="w-full p-4 bg-muted/50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-foreground"
                        minDate={new Date()}
                        excludeDates={bookedDates}
                        filterDate={(date) => !isDateBooked(date)}
                        placeholderText="Select an available date"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Event Type</label>
                      <select 
                        value={formData.eventType}
                        onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                        className="w-full p-4 bg-muted/50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-foreground appearance-none"
                      >
                        <option>Ceremony</option>
                        <option>Meeting</option>
                        <option>Banquet</option>
                        <option>Conference</option>
                        <option>Engagement</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Full Name</label>
                      <input 
                        required
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full p-4 bg-muted/50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-foreground"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Email</label>
                        <input 
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full p-4 bg-muted/50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-foreground"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Phone</label>
                        <input 
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full p-4 bg-muted/50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-foreground"
                          placeholder="Your number"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      disabled={loading || !formData.eventDate || !formData.fullName || !formData.email || !formData.phone}
                      type="submit"
                      className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-500/40 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {loading ? (
                        <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-white rounded-full"></div>
                      ) : (
                        <>
                          Continue to Payment
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Checkout Stripe */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                     <h3 className="text-2xl font-bold">Secure Checkout</h3>
                     <button 
                       onClick={() => setStep(1)} 
                       className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                     >
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                       Back
                     </button>
                  </div>

                  {clientSecret ? (
                    <div className="bg-muted/30 p-6 rounded-2xl border border-border">
                      <Elements stripe={stripePromise} options={stripeOptions} key={clientSecret}>
                        <CheckoutForm 
                          bookingData={bookingDataPayload} 
                          onSuccess={handlePaymentSuccess}
                          onSubmitApi={hallAPI.book}
                        />
                      </Elements>
                    </div>
                  ) : (
                     <div className="py-20 flex justify-center items-center">
                        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-orange-500 rounded-full"></div>
                     </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-8">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                     Payments are secure and encrypted
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

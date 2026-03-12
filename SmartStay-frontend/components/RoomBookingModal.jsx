"use client"
import { useState, useEffect, useMemo } from "react"
import { bookingAPI, paymentAPI } from "@/lib/api"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import CheckoutForm from "./CheckoutForm"
import "@/styles/roombooking.css"

// Initialize Stripe outside the component to avoid reloading it on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function RoomBookingModal({ isOpen, onClose, room }) {
  // --- FIX 1: Prevent "Cannot read properties of null" crash ---
  // We use this 'safeRoom' for calculations so the app doesn't crash before the 'if (!room)' check runs.
  const safeRoom = room || { 
    image: '', 
    name: '', 
    price: '₹0', 
    amenities: [], 
    id: 0 
  };

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedDates, setSelectedDates] = useState({ checkIn: null, checkOut: null })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookedDates, setBookedDates] = useState([]) // Store booked ranges
  const [guestDetails, setGuestDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    adults: 2,
    children: 0,
    specialRequests: "",
  })
  
  // New State for Stripe
  const [clientSecret, setClientSecret] = useState("")

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [is360View, setIs360View] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [bookingId, setBookingId] = useState("")
  const [errors, setErrors] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)

  // Reset all state when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      // Reset to initial state when modal opens
      setCurrentStep(1)
      setSelectedDates({ checkIn: null, checkOut: null })
      setCurrentMonth(new Date())
      setGuestDetails({
        fullName: "",
        email: "",
        phone: "",
        adults: 2,
        children: 0,
        specialRequests: "",
      })
      setCurrentImageIndex(0)
      setIs360View(false)
      setRotation(0)
      setIsDragging(false)
      setStartX(0)
      setBookingComplete(false)
      setShowConfetti(false)
      setBookingId("")
      setClientSecret("") // Reset secret
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // --- NEW: Fetch Booked Dates ---
  useEffect(() => {
    if (isOpen && room) {
      const fetchBookedDates = async () => {
        try {
          // Use .id (custom) or ._id (MongoDB)
          const targetId = room.id || room._id;
          const dates = await bookingAPI.getBookedDates(targetId);
          setBookedDates(dates.map(d => ({
            checkIn: new Date(d.checkIn),
            checkOut: new Date(d.checkOut)
          })));
        } catch (error) {
          console.error("Failed to fetch booked dates:", error);
        }
      };
      fetchBookedDates();
    }
  }, [isOpen, room]);

  // Check if a date is within any booked range
  const isDateBooked = (date) => {
    return bookedDates.some(booking => {
      // Logic: date >= checkIn AND date < checkOut (since checkOut usually means they leave that morning)
      // But typically check-in is afternoon.
      // Easiest is to check full day overlap strictly.
      // Let's settle on: A date is booked if it is >= checkIn AND < checkOut.
      // Wait, checkOut day is usually available for new checkIn.
      // So [checkIn, checkOut) interval.
      const start = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      // Normalize to Ignore Time
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      const target = new Date(date);
      target.setHours(0,0,0,0);
      
      return target >= start && target < end; 
    });
  };

  // --- Helpers for Calculations ---
  // UPDATED: Use safeRoom instead of room
  const roomImages = [
    { type: "main", url: safeRoom.image, label: "Room View" },
    { type: "bed", url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85", label: "Bed View" },
    { type: "bathroom", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14", label: "Bathroom" },
    { type: "balcony", url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", label: "Balcony" },
    { type: "amenities", url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461", label: "Amenities" },
  ]

  const pricingData = {
    // UPDATED: Check if price exists before replacing, handle both $ and ₹
    basePrice: safeRoom.price ? parseInt(safeRoom.price.replace(/[^0-9]/g, "")) : 0,
    taxes: 0.18, // 18% tax
    serviceFee: 20,
  }

  const getDayPrice = (date) => {
    const day = date.getDay()
    const basePrice = pricingData.basePrice
    // Weekend pricing (Friday, Saturday)
    if (day === 5 || day === 6) {
      return basePrice * 1.3 // 30% higher
    }
    return basePrice
  }

  const getAmenityIcon = (label) => {
    const icons = {
      "Free Wi-Fi": (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      ),
      "Air Conditioning": (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 2h8"></path>
          <path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2"></path>
          <path d="M7 15h10"></path>
        </svg>
      ),
      "Hot Water": (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 2h6"></path>
          <path d="M12 2v8"></path>
          <path d="M6 10h12"></path>
          <path d="M8 14v8"></path>
          <path d="M12 14v8"></path>
          <path d="M16 14v8"></path>
        </svg>
      ),
      "Smart TV": (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
          <polyline points="17 2 12 7 7 2"></polyline>
        </svg>
      ),
    }
    return icons[label] || (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    )
  }

  const calculateNights = () => {
    if (!selectedDates.checkIn || !selectedDates.checkOut) return 0
    const diffTime = Math.abs(selectedDates.checkOut - selectedDates.checkIn)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const calculateTotal = () => {
    const nights = calculateNights()
    if (nights === 0) return 0
    let subtotal = 0
    const currentDate = new Date(selectedDates.checkIn)
    for (let i = 0; i < nights; i++) {
      subtotal += getDayPrice(currentDate)
      currentDate.setDate(currentDate.getDate() + 1)
    }
    const taxes = subtotal * pricingData.taxes
    return subtotal + taxes + pricingData.serviceFee
  }

  // --- Handlers ---

  if (!isOpen || !room) return null

  const handleClose = () => {
    const hasStartedBooking = selectedDates.checkIn || selectedDates.checkOut ||
                              guestDetails.fullName || guestDetails.email || guestDetails.phone
    const hasNotCompletedPayment = currentStep < 3 && !bookingComplete
    
    if (hasStartedBooking && hasNotCompletedPayment) {
      setShowExitConfirmation(true)
      return
    }
    confirmClose()
  }

  const confirmClose = () => {
    setCurrentStep(1)
    setSelectedDates({ checkIn: null, checkOut: null })
    setCurrentMonth(new Date())
    setGuestDetails({
      fullName: "",
      email: "",
      phone: "",
      adults: 2,
      children: 0,
      specialRequests: "",
    })
    setCurrentImageIndex(0)
    setIs360View(false)
    setRotation(0)
    setIsDragging(false)
    setStartX(0)
    setBookingComplete(false)
    setShowConfetti(false)
    setBookingId("")
    setShowExitConfirmation(false)
    setErrors({})
    setIsProcessing(false)
    onClose()
  }

  const cancelExit = () => setShowExitConfirmation(false)

  const handleStepClick = (step) => {
    if (step <= currentStep || step === currentStep + 1) {
      setCurrentStep(step)
    }
  }

  const handle360Drag = (e) => {
    if (!isDragging) return
    const deltaX = e.clientX - startX
    setRotation((prev) => prev + deltaX * 0.5)
    setStartX(e.clientX)
  }

  const handle360Touch = (e) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - startX
    setRotation((prev) => prev + deltaX * 0.5)
    setStartX(touch.clientX)
  }

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 10 && cleaned.length <= 15
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!guestDetails.fullName.trim()) newErrors.fullName = "Full name is required"
    else if (guestDetails.fullName.trim().length < 2) newErrors.fullName = "Name must be at least 2 characters"

    if (!guestDetails.email.trim()) newErrors.email = "Email is required"
    else if (!validateEmail(guestDetails.email)) newErrors.email = "Please enter a valid email address"

    if (!guestDetails.phone.trim()) newErrors.phone = "Phone number is required"
    else if (!validatePhone(guestDetails.phone)) newErrors.phone = "Please enter a valid phone number (10-15 digits)"

    if (guestDetails.adults < 1) newErrors.adults = "At least 1 adult is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    setErrors({})
    if (currentStep === 1) {
      if (!selectedDates.checkIn || !selectedDates.checkOut) {
        setErrors({ dates: "Please select check-in and check-out dates" })
        return
      }
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        return
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    setErrors({})
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // --- STRIPE INTEGRATION START ---

  // 1. Prepare Booking Data Object (Memoized for stability)
  const bookingData = useMemo(() => {
    if(!selectedDates.checkIn || !selectedDates.checkOut) return null;
    
    return {
      roomId: safeRoom.id, // UPDATED: safeRoom
      roomName: safeRoom.name, // UPDATED: safeRoom
      checkIn: selectedDates.checkIn.toISOString(),
      checkOut: selectedDates.checkOut.toISOString(),
      guestDetails: {
        fullName: guestDetails.fullName.trim(),
        email: guestDetails.email.trim(),
        phone: guestDetails.phone.trim(),
        adults: guestDetails.adults,
        children: guestDetails.children,
        specialRequests: guestDetails.specialRequests.trim()
      },
      pricing: {
        basePrice: pricingData.basePrice,
        nights: calculateNights(),
        subtotal: (calculateTotal() - pricingData.serviceFee) / 1.18,
        taxes: ((calculateTotal() - pricingData.serviceFee) / 1.18) * pricingData.taxes,
        serviceFee: pricingData.serviceFee,
        total: calculateTotal()
      }
    }
  }, [safeRoom, selectedDates, guestDetails]); // UPDATED dependency

  // 2. Fetch Client Secret when Step 3 is Active
  useEffect(() => {
    if (currentStep === 3 && !clientSecret && room) { // Check 'room' to ensure data exists
      const fetchSecret = async () => {
        try {
          const targetId = room.id || room._id;
          const data = await paymentAPI.createPaymentIntent(targetId, calculateNights())
          setClientSecret(data.clientSecret)
        } catch (error) {
          console.error("Payment Init Error:", error);
          setErrors({ payment: "Failed to initialize payment: " + error.message })
        }
      }
      fetchSecret()
    }
  }, [currentStep, safeRoom.id, clientSecret]) // UPDATED dependency

  // --- FIX 2: Stabilize Stripe Options ---
  // We use useMemo to prevent the options object from being re-created on every render.
  // This stops Stripe from reloading the Element when you type or click.
  const stripeOptions = useMemo(() => ({
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  }), [clientSecret]);


  // 3. Handle Successful Payment (Called by CheckoutForm)
  const handlePaymentSuccess = () => {
    setBookingComplete(true)
    setBookingId('BK' + Date.now().toString().slice(-8)) // Or get actual ID from API response if you modify API to return it
    setShowConfetti(true)
    setCurrentStep(4)
    
    setTimeout(() => {
      setShowConfetti(false)
    }, 4000)
  }

  // --- STRIPE INTEGRATION END ---

  const downloadInvoice = () => {
    // ... existing invoice code ...
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
    .special-requests { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>HOTEL BOOKING INVOICE</h1>
    <div class="booking-id">Booking ID: ${bookingId}</div>
    <p style="margin-top: 10px; color: #666;">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <h2>Customer Details</h2>
    <div class="row"><span>Name:</span><span>${guestDetails.fullName}</span></div>
    <div class="row"><span>Email:</span><span>${guestDetails.email}</span></div>
    <div class="row"><span>Phone:</span><span>${guestDetails.phone}</span></div>
    <div class="row"><span>Guests:</span><span>${guestDetails.adults} Adults, ${guestDetails.children} Children</span></div>
  </div>

  <div class="section">
    <h2>Booking Details</h2>
    <div class="row"><span>Room:</span><span>${room.name}</span></div>
    <div class="row"><span>Check-in:</span><span>${selectedDates.checkIn?.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
    <div class="row"><span>Check-out:</span><span>${selectedDates.checkOut?.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
    <div class="row"><span>Number of Nights:</span><span>${calculateNights()}</span></div>
  </div>

  <div class="section">
    <h2>Payment Summary</h2>
    <div class="row"><span>Room Charges (${calculateNights()} nights):</span><span>₹${pricingData.basePrice * calculateNights()}</span></div>
    <div class="row"><span>Service Fee:</span><span>₹${pricingData.serviceFee}</span></div>
    <div class="row"><span>Taxes (18%):</span><span>₹${(pricingData.basePrice * calculateNights() * pricingData.taxes).toFixed(2)}</span></div>
    <div class="row total-row"><span>Total Paid:</span><span>₹${calculateTotal().toFixed(2)}</span></div>
  </div>

  ${guestDetails.specialRequests ? `
  <div class="section">
    <h2>Special Requests</h2>
    <div class="special-requests">${guestDetails.specialRequests}</div>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Thank you for your booking!</strong></p>
    <p>For any queries, please contact us at support@hotel.com</p>
  </div>
</body>
</html>
    `
    const printWindow = window.open('', '_blank')
    printWindow.document.write(invoiceHTML)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
  }

  return (
    <>
      <div className="booking-modal-overlay" onClick={handleClose}>
        <div className="booking-modal-container" onClick={(e) => e.stopPropagation()}>
          <button className="booking-modal-close" onClick={handleClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

        {/* Step Indicator */}
        <div className="step-indicator">
          {/* ... Existing Step Indicator Code ... */}
          <div
            className={`step ${currentStep >= 1 ? "active" : ""} ${currentStep > 1 ? "completed" : ""}`}
            onClick={() => handleStepClick(1)}
          >
            <div className="step-number">
              {currentStep > 1 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : "1"}
            </div>
            <div className="step-label">Room Details</div>
          </div>
          <div className="step-line"></div>
          <div
            className={`step ${currentStep >= 2 ? "active" : ""} ${currentStep > 2 ? "completed" : ""}`}
            onClick={() => handleStepClick(2)}
          >
            <div className="step-number">
              {currentStep > 2 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : "2"}
            </div>
            <div className="step-label">Guest Details</div>
          </div>
          <div className="step-line"></div>
          <div
            className={`step ${currentStep >= 3 ? "active" : ""} ${currentStep > 3 ? "completed" : ""}`}
            onClick={() => handleStepClick(3)}
          >
            <div className="step-number">
              {currentStep > 3 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : "3"}
            </div>
            <div className="step-label">Payment</div>
          </div>
        </div>

        {/* Step 1: Room Details (Unchanged) */}
        {currentStep === 1 && (
          <div className="booking-content step-1">
            {/* ... Content of Step 1 ... */}
            <div className="room-media-section">
              <div className="main-image-container">
                {is360View ? (
                  <div
                    className="view-360"
                    onMouseDown={(e) => {
                      setIsDragging(true)
                      setStartX(e.clientX)
                    }}
                    onMouseMove={handle360Drag}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onTouchStart={(e) => {
                      setIsDragging(true)
                      setStartX(e.touches[0].clientX)
                    }}
                    onTouchMove={handle360Touch}
                    onTouchEnd={() => setIsDragging(false)}
                    style={{
                      backgroundImage: `url(${roomImages[currentImageIndex].url})`,
                      backgroundPosition: `${rotation}px center`,
                    }}
                  >
                    <div className="view-360-hint">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                      </svg>
                      Drag to rotate 360°
                    </div>
                  </div>
                ) : (
                  <img src={roomImages[currentImageIndex].url} alt={roomImages[currentImageIndex].label} />
                )}
                <button className="view-360-toggle" onClick={() => setIs360View(!is360View)}>
                  {is360View ? "Exit 360°" : "360° View"}
                </button>
              </div>

              <div className="thumbnail-gallery">
                {roomImages.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${currentImageIndex === index ? "active" : ""}`}
                    onClick={() => {
                      setCurrentImageIndex(index)
                      setIs360View(false)
                    }}
                  >
                    <img src={img.url} alt={img.label} />
                    <span className="thumbnail-label">{img.label}</span>
                  </div>
                ))}
              </div>

              <div className="important-notes">
                 {/* ... Notes List ... */}
                 <h4 className="notes-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Important Information
                </h4>
                <div className="notes-list">
                  <div className="note-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span><strong>Check-in:</strong> 2:00 PM onwards</span>
                  </div>
                  <div className="note-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span><strong>Check-out:</strong> 11:00 AM</span>
                  </div>
                  <div className="note-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span><strong>ID Required:</strong> Valid government ID at check-in</span>
                  </div>
                  <div className="note-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span><strong>Cancellation:</strong> Free cancellation up to 24 hours before check-in</span>
                  </div>
                  <div className="note-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span><strong>Payment:</strong> Full payment required at booking</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="room-details-section">
              <div className="room-header-compact">
                <h2 className="room-title">{room.name}</h2>
                <div className="room-price-badge">{room.price}/night</div>
              </div>

              {/* ... Room Specs ... */}
              <div className="room-info-compact">
                <div className="spec-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>35 sqm</span>
                </div>
                <div className="spec-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  <span>King Bed</span>
                </div>
                <div className="spec-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Max 4 Guests</span>
                </div>
                {room.amenities.slice(0, 2).map((amenity, idx) => (
                  <div key={idx} className="spec-item">
                    <span className="amenity-icon">{getAmenityIcon(amenity.label)}</span>
                    <span>{amenity.label}</span>
                  </div>
                ))}
              </div>

              <div className="calendar-section">
                <h3>Select Your Dates</h3>
                
                <div className="calendar-widget">
                  <div className="calendar-header">
                    <button
                      className="calendar-nav-btn"
                      onClick={() => {
                        const newMonth = new Date(currentMonth)
                        newMonth.setMonth(newMonth.getMonth() - 1)
                        setCurrentMonth(newMonth)
                      }}
                    >
                      ‹
                    </button>
                    
                    <div className="calendar-selectors">
                      <select
                        className="month-selector"
                        value={currentMonth.getMonth()}
                        onChange={(e) => {
                          const newMonth = new Date(currentMonth)
                          newMonth.setMonth(parseInt(e.target.value))
                          setCurrentMonth(newMonth)
                        }}
                      >
                        {['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                          <option key={idx} value={idx}>{month}</option>
                        ))}
                      </select>
                      
                      <select
                        className="year-selector"
                        value={currentMonth.getFullYear()}
                        onChange={(e) => {
                          const newMonth = new Date(currentMonth)
                          newMonth.setFullYear(parseInt(e.target.value))
                          setCurrentMonth(newMonth)
                        }}
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      className="calendar-nav-btn"
                      onClick={() => {
                        const newMonth = new Date(currentMonth)
                        newMonth.setMonth(newMonth.getMonth() + 1)
                        setCurrentMonth(newMonth)
                      }}
                    >
                      ›
                    </button>
                  </div>

                  <div className="calendar-grid">
                    <div className="calendar-weekdays">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                        <div key={day} className="calendar-weekday">{day}</div>
                      ))}
                    </div>

                    <div className="calendar-dates">
                      {(() => {
                        const year = currentMonth.getFullYear()
                        const month = currentMonth.getMonth()
                        const firstDay = new Date(year, month, 1).getDay()
                        const daysInMonth = new Date(year, month + 1, 0).getDate()
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        
                        const dates = []
                        
                        // Empty cells for days before month starts
                        for (let i = 0; i < firstDay; i++) {
                          dates.push(<div key={`empty-${i}`} className="calendar-date empty"></div>)
                        }
                        
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(year, month, day)
                            const dayPrice = getDayPrice(date)
                            const isPast = date < today
                            const isBooked = isDateBooked(date); // Check if booked
                            
                            const isSelected = (selectedDates.checkIn && date.toDateString() === selectedDates.checkIn.toDateString()) ||
                                               (selectedDates.checkOut && date.toDateString() === selectedDates.checkOut.toDateString())
                            const isInRange = selectedDates.checkIn && selectedDates.checkOut &&
                                              date > selectedDates.checkIn && date < selectedDates.checkOut
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6
                            
                            dates.push(
                              <div
                                key={day}
                                className={`calendar-date ${isPast ? 'past' : ''} ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''} ${isInRange ? 'in-range' : ''} ${isWeekend ? 'weekend' : ''}`}
                                onClick={() => {
                                  if (isPast || isBooked) return // Disable click
                                  
                                  if (!selectedDates.checkIn || (selectedDates.checkIn && selectedDates.checkOut)) {
                                    setSelectedDates({ checkIn: date, checkOut: null })
                                  } else if (date > selectedDates.checkIn) {
                                    // Verify no booked dates in between
                                    const start = new Date(selectedDates.checkIn);
                                    let current = new Date(start);
                                    current.setDate(current.getDate() + 1);
                                    let hasConflict = false;
                                    
                                    while (current < date) {
                                      if (isDateBooked(current)) {
                                        hasConflict = true;
                                        break;
                                      }
                                      current.setDate(current.getDate() + 1);
                                    }
                                    
                                    if (hasConflict) {
                                      setErrors({ dates: "Selected range includes booked dates." });
                                      return;
                                    }

                                    setSelectedDates({ ...selectedDates, checkOut: date })
                                  } else {
                                    setSelectedDates({ checkIn: date, checkOut: null })
                                  }
                                }}
                                title={isBooked ? "Booked" : ""}
                              >
                                <div className="date-number">{day}</div>
                                <div className="date-price">₹{dayPrice}</div>
                              </div>
                            )
                          }
                        
                        return dates
                      })()}
                    </div>
                  </div>

                  {calculateNights() > 0 && (
                    <div className="calendar-footer">
                      <div className="calendar-summary">
                        <div className="summary-item">
                          <span className="summary-label">Check-in</span>
                          <span className="summary-value">{selectedDates.checkIn?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="summary-divider">→</div>
                        <div className="summary-item">
                          <span className="summary-label">Check-out</span>
                          <span className="summary-value">{selectedDates.checkOut?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="summary-divider">•</div>
                        <div className="summary-item">
                          <span className="summary-label">{calculateNights()} nights</span>
                          <span className="summary-value">₹{calculateTotal().toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {calculateNights() > 0 && (
                  <div className="price-summary">
                    <div className="price-row">
                      <span>{calculateNights()} nights</span>
                      <span>₹{((calculateTotal() - pricingData.serviceFee) / 1.18).toFixed(2)}</span>
                    </div>
                    <div className="price-row">
                      <span>Service fee</span>
                      <span>₹{pricingData.serviceFee}</span>
                    </div>
                    <div className="price-row">
                      <span>Taxes (18%)</span>
                      <span>₹{(((calculateTotal() - pricingData.serviceFee) / 1.18) * pricingData.taxes).toFixed(2)}</span>
                    </div>
                    <div className="price-row total">
                      <span>Total</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {errors.dates && (
                <div className="error-message" style={{
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '8px',
                  color: '#c33',
                  fontSize: '14px'
                }}>
                  {errors.dates}
                </div>
              )}

              <button
                className="btn btn-primary continue-btn"
                onClick={handleNextStep}
                disabled={!selectedDates.checkIn || !selectedDates.checkOut}
              >
                Continue to Checkout
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Guest Details (Unchanged) */}
        {currentStep === 2 && (
          <div className="booking-content step-2">
            <div className="guest-form-section">
              <h2>Guest Information</h2>
              <form className="guest-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={guestDetails.fullName}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[^a-zA-Z\s'-]/g, '')
                        setGuestDetails({ ...guestDetails, fullName: sanitized })
                        if (errors.fullName) {
                          setErrors({ ...errors, fullName: '' })
                        }
                      }}
                      className={errors.fullName ? 'error' : ''}
                      maxLength={50}
                      required
                    />
                    {errors.fullName && <span className="error-text" style={{ color: '#c33', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.fullName}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={guestDetails.email}
                      onChange={(e) => {
                        setGuestDetails({ ...guestDetails, email: e.target.value.trim() })
                        if (errors.email) {
                          setErrors({ ...errors, email: '' })
                        }
                      }}
                      className={errors.email ? 'error' : ''}
                      maxLength={100}
                      required
                    />
                    {errors.email && <span className="error-text" style={{ color: '#c33', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={guestDetails.phone}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[^0-9\s+()-]/g, '')
                        setGuestDetails({ ...guestDetails, phone: sanitized })
                        if (errors.phone) {
                          setErrors({ ...errors, phone: '' })
                        }
                      }}
                      className={errors.phone ? 'error' : ''}
                      maxLength={20}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Adults</label>
                    <select
                      value={guestDetails.adults}
                      onChange={(e) => setGuestDetails({ ...guestDetails, adults: parseInt(e.target.value) })}
                    >
                      {[1, 2, 3, 4].map((num) => (
                        <option key={num} value={num}>
                          {num} Adult{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Children</label>
                    <select
                      value={guestDetails.children}
                      onChange={(e) => setGuestDetails({ ...guestDetails, children: parseInt(e.target.value) })}
                    >
                      {[0, 1, 2, 3].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Child" : "Children"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Special Requests (Optional)</label>
                  <textarea
                    placeholder="Any special requirements or requests..."
                    rows="4"
                    value={guestDetails.specialRequests}
                    onChange={(e) => setGuestDetails({ ...guestDetails, specialRequests: e.target.value })}
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="booking-summary-section">
              <div className="booking-summary-card">
                <h3>Booking Summary</h3>
                <div className="summary-room">
                  <img src={room.image} alt={room.name} />
                  <div>
                    <h4>{room.name}</h4>
                    <p>{room.price} per night</p>
                  </div>
                </div>

                <div className="summary-details">
                  <div className="summary-row">
                    <span>Check-in</span>
                    <span>{selectedDates.checkIn?.toLocaleDateString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Check-out</span>
                    <span>{selectedDates.checkOut?.toLocaleDateString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Nights</span>
                    <span>{calculateNights()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Guests</span>
                    <span>{guestDetails.adults + guestDetails.children}</span>
                  </div>
                </div>

                <div className="summary-pricing">
                  <div className="summary-row">
                    <span>{room.price} × {calculateNights()} nights</span>
                    <span>₹{pricingData.basePrice * calculateNights()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Service fee</span>
                    <span>₹{pricingData.serviceFee}</span>
                  </div>
                  <div className="summary-row">
                    <span>Taxes</span>
                    <span>₹{(pricingData.basePrice * calculateNights() * pricingData.taxes).toFixed(2)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button className="btn btn-secondary" onClick={handlePrevStep}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNextStep}
                disabled={!guestDetails.fullName || !guestDetails.email || !guestDetails.phone}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment (UPDATED WITH STRIPE) */}
        {currentStep === 3 && !bookingComplete && (
          <div className="booking-content step-3">
            <div className="payment-section">
              <h2>Payment Method</h2>
              
              {/* Keeping your original radio buttons for UI consistency */}
              <div className="payment-options">
                <div className="payment-option">
                  <input type="radio" id="card" name="payment" defaultChecked />
                  <label htmlFor="card">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    Credit / Debit Card
                  </label>
                </div>
                <div className="payment-option">
                  <input type="radio" id="upi" name="payment" />
                  <label htmlFor="upi">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    UPI
                  </label>
                </div>
                {/* ... other options ... */}
              </div>

              {/* REPLACED MANUAL FORM WITH STRIPE ELEMENTS */}
              <div className="payment-form">
                <h3>Card Details</h3>
                {clientSecret ? (
                  /* UPDATED: Added key and options using memoized object */
                  <Elements stripe={stripePromise} options={stripeOptions} key={clientSecret}>
                    <CheckoutForm 
                      bookingData={bookingData} 
                      onSuccess={handlePaymentSuccess}
                      onError={(msg) => setErrors({ payment: msg })}
                    />
                  </Elements>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <span className="loading-spinner" style={{
                        display: 'inline-block',
                        width: '24px',
                        height: '24px',
                        border: '3px solid #ccc',
                        borderTopColor: '#0070f3',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></span>
                    <p>Loading secure payment gateway...</p>
                  </div>
                )}
              </div>

              <div className="secure-payment-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Your payment information is secure and encrypted
              </div>
            </div>

            <div className="payment-summary-section">
              <div className="booking-summary-card">
                <h3>Final Amount</h3>
                <div className="summary-room">
                  <img src={room.image} alt={room.name} />
                  <div>
                    <h4>{room.name}</h4>
                    <p>{calculateNights()} nights</p>
                  </div>
                </div>

                <div className="summary-pricing">
                  <div className="summary-row">
                    <span>Room charges</span>
                    <span>₹{pricingData.basePrice * calculateNights()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Service fee</span>
                    <span>₹{pricingData.serviceFee}</span>
                  </div>
                  <div className="summary-row">
                    <span>Taxes</span>
                    <span>₹{(pricingData.basePrice * calculateNights() * pricingData.taxes).toFixed(2)}</span>
                  </div>
                  <div className="summary-row total-payable">
                    <span>Total Payable</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {errors.payment && (
              <div className="error-message" style={{
                padding: '12px',
                marginBottom: '16px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                fontSize: '14px'
              }}>
                {errors.payment}
              </div>
            )}

            <div className="step-actions">
              <button
                className="btn btn-secondary"
                onClick={handlePrevStep}
                disabled={isProcessing}
              >
                Back
              </button>
              {/* Removed original Confirm Button as CheckoutForm has its own button */}
            </div>
          </div>
        )}

        {/* Step 4: Success Screen (Unchanged) */}
        {currentStep === 4 && bookingComplete && (
          <div className="booking-content success-screen">
            {showConfetti && (
              <div className="confetti-container">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={i}
                    className="confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      backgroundColor: ['#ff8c42', '#ff6b35', '#4caf50', '#2196f3', '#ffd700'][Math.floor(Math.random() * 5)]
                    }}
                  />
                ))}
              </div>
            )}

            <div className="success-content">
              <div className="success-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>

              <h2 className="success-title">Booking Confirmed!</h2>
              <p className="success-message">Your payment was successful. We've sent a confirmation email to {guestDetails.email}</p>

              <div className="invoice-card">
                <div className="invoice-header">
                  <h3>Booking Invoice</h3>
                  <span className="booking-id">ID: {bookingId}</span>
                </div>
                {/* Invoice Content */}
                <div className="invoice-section">
                  <h4>Customer Details</h4>
                  <div className="invoice-row"><span>Name:</span><span>{guestDetails.fullName}</span></div>
                  <div className="invoice-row"><span>Email:</span><span>{guestDetails.email}</span></div>
                  <div className="invoice-row"><span>Phone:</span><span>{guestDetails.phone}</span></div>
                  <div className="invoice-row"><span>Guests:</span><span>{guestDetails.adults} Adults, {guestDetails.children} Children</span></div>
                </div>

                <div className="invoice-section">
                  <h4>Booking Details</h4>
                  <div className="invoice-row"><span>Room:</span><span>{room.name}</span></div>
                  <div className="invoice-row"><span>Check-in:</span><span>{selectedDates.checkIn?.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
                  <div className="invoice-row"><span>Check-out:</span><span>{selectedDates.checkOut?.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
                  <div className="invoice-row"><span>Nights:</span><span>{calculateNights()}</span></div>
                </div>

                <div className="invoice-section">
                  <h4>Payment Summary</h4>
                  <div className="invoice-row"><span>Room Charges:</span><span>₹{pricingData.basePrice * calculateNights()}</span></div>
                  <div className="invoice-row"><span>Service Fee:</span><span>₹{pricingData.serviceFee}</span></div>
                  <div className="invoice-row"><span>Taxes (18%):</span><span>₹{(pricingData.basePrice * calculateNights() * pricingData.taxes).toFixed(2)}</span></div>
                  <div className="invoice-row total-row"><span>Total Paid:</span><span>₹{calculateTotal().toFixed(2)}</span></div>
                </div>

                {guestDetails.specialRequests && (
                  <div className="invoice-section">
                    <h4>Special Requests</h4>
                    <p className="special-requests">{guestDetails.specialRequests}</p>
                  </div>
                )}
              </div>

              <div className="success-actions">
                <button className="btn btn-primary" onClick={downloadInvoice}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download Invoice
                </button>
                <button className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Exit Confirmation Dialog (Unchanged) */}
    {showExitConfirmation && (
      <div className="confirmation-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-dialog">
          <div className="confirmation-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3>Leave Booking?</h3>
          <p>If you leave now, all your progress will be lost.</p>
          <div className="confirmation-actions">
            <button className="btn-confirm btn-stay" onClick={cancelExit}>
              Stay & Continue
            </button>
            <button className="btn-confirm btn-leave" onClick={confirmClose}>
              Leave Anyway
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
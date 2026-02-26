"use client"

import { useState, useEffect } from "react"
import { userAPI, bookingAPI } from "@/lib/api"
import "@/styles/profile.css"

export default function ProfileModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("profile")
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState({})
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: ""
  })

  // Fetch user profile and bookings when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserData()
      fetchBookings()
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("profile")
      setIsEditing(false)
      setErrors({})
    }
  }, [isOpen])

  const fetchUserData = async () => {
    setIsLoading(true)
    try {
      const response = await userAPI.getProfile()
      setUser(response.user || response)
      setFormData({
        name: response.user?.name || response.name || "",
        phone: response.user?.phone || response.phone || "",
        email: response.user?.email || response.email || ""
      })
    } catch (error) {
      console.error("Failed to fetch user data:", error)
      setErrors({ fetch: error.message || "Failed to load profile" })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBookings = async () => {
    setIsLoadingBookings(true)
    
    try {
      const response = await bookingAPI.getUserBookings()
      setBookings(response.bookings || [])
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
    } finally {
      setIsLoadingBookings(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (formData.phone && !/^\+?[\d\s()-]{10,20}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    setErrors({})

    try {
      const response = await userAPI.updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim()
      })
      
      setUser(response.user || response)
      setIsEditing(false)
      
      // Show success toast
      showToast("Profile updated successfully", "success")
    } catch (error) {
      const errorMessage = error.message || "Failed to update profile"
      setErrors({ save: errorMessage })
      showToast(errorMessage, "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || ""
    })
    setIsEditing(false)
    setErrors({})
  }

  const downloadBookingPDF = (booking) => {
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
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600; }
    .status-confirmed { background: #d4edda; color: #155724; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    .status-completed { background: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <div class="header">
    <h1>HOTEL SMARTSTAY</h1>
    <div class="booking-id">Booking ID: ${booking.bookingId}</div>
    <p style="margin-top: 10px; color: #666;">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <h2>Booking Status</h2>
    <div class="row">
      <span>Status:</span>
      <span class="status-badge status-${booking.status}">${booking.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="section">
    <h2>Guest Details</h2>
    <div class="row"><span>Name:</span><span>${user?.name || 'N/A'}</span></div>
    <div class="row"><span>Email:</span><span>${user?.email || 'N/A'}</span></div>
    <div class="row"><span>Phone:</span><span>${user?.phone || 'N/A'}</span></div>
  </div>

  <div class="section">
    <h2>Booking Details</h2>
    <div class="row"><span>Room:</span><span>${booking.roomName}</span></div>
    <div class="row"><span>Check-in:</span><span>${new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
    <div class="row"><span>Check-out:</span><span>${new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
    <div class="row"><span>Number of Nights:</span><span>${booking.nights}</span></div>
    <div class="row"><span>Guests:</span><span>${booking.guests || 'N/A'}</span></div>
  </div>

  <div class="section">
    <h2>Payment Summary</h2>
    <div class="row"><span>Room Charges (${booking.nights} nights):</span><span>₹${(booking.total * 0.75).toFixed(2)}</span></div>
    <div class="row"><span>Service Fee:</span><span>₹20.00</span></div>
    <div class="row"><span>Taxes (18%):</span><span>₹${(booking.total * 0.15).toFixed(2)}</span></div>
    <div class="row total-row"><span>Total Amount:</span><span>₹${booking.total.toFixed(2)}</span></div>
  </div>

  <div class="footer">
    <p><strong>Thank you for choosing Hotel SmartStay!</strong></p>
    <p>For any queries, please contact us at support@smartstay.com</p>
    <p style="margin-top: 20px; font-size: 12px;">Booked on: ${new Date(booking.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
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

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => toast.classList.add("show"), 100)
    setTimeout(() => {
      toast.classList.remove("show")
      setTimeout(() => document.body.removeChild(toast), 300)
    }, 3000)
  }

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'status-confirmed'
      case 'cancelled': return 'status-cancelled'
      case 'completed': return 'status-completed'
      default: return 'status-confirmed'
    }
  }

  if (!isOpen) return null

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="profile-modal-header">
          <h2>My Account</h2>
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profile
            </button>
            <button
              className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              My Bookings
            </button>
          </div>
        </div>

        <div className="profile-modal-content">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="profile-tab">
              {isLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading profile...</p>
                </div>
              ) : (
                <>
                  <div className="profile-avatar-section">
                    <div className="profile-avatar">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="profile-info">
                      <h3>{user?.name || "User"}</h3>
                      <p>{user?.email}</p>
                    </div>
                  </div>

                  {errors.fetch && (
                    <div className="error-banner">
                      {errors.fetch}
                    </div>
                  )}

                  <div className="profile-form">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^a-zA-Z\s'-]/g, '')
                          setFormData({ ...formData, name: sanitized })
                          if (errors.name) setErrors({ ...errors, name: '' })
                        }}
                        disabled={!isEditing}
                        className={errors.name ? 'error' : ''}
                        maxLength={50}
                      />
                      {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="disabled-input"
                      />
                      <span className="help-text">Email cannot be changed</span>
                    </div>

                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^0-9\s+()-]/g, '')
                          setFormData({ ...formData, phone: sanitized })
                          if (errors.phone) setErrors({ ...errors, phone: '' })
                        }}
                        disabled={!isEditing}
                        className={errors.phone ? 'error' : ''}
                        placeholder="+1 (555) 000-0000"
                        maxLength={20}
                      />
                      {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>

                    {errors.save && (
                      <div className="error-banner">
                        {errors.save}
                      </div>
                    )}

                    <div className="profile-actions">
                      {!isEditing ? (
                        <button
                          className="btn btn-primary"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn btn-secondary"
                            onClick={handleCancel}
                            disabled={isSaving}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <span className="spinner-small"></span>
                                Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="bookings-tab">
              {bookings.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <h3>No Bookings Yet</h3>
                  <p>Start exploring our rooms and make your first booking!</p>
                  <button className="btn btn-primary" onClick={onClose}>
                    Browse Rooms
                  </button>
                </div>
              ) : (
                <div className="bookings-list">
                  {bookings.map((booking) => (
                    <div key={booking.id || booking.bookingId} className="booking-card">
                      <div className="booking-header">
                        <div className="booking-id-badge">
                          {booking.bookingId}
                        </div>
                        <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="booking-details">
                        <div className="booking-room">
                          {booking.roomImage && (
                            <img src={booking.roomImage} alt={booking.roomName} />
                          )}
                          <div>
                            <h4>{booking.roomName}</h4>
                            <p className="booking-dates">
                              {new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="booking-info-grid">
                          <div className="info-item">
                            <span className="info-label">Nights</span>
                            <span className="info-value">{booking.nights}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Guests</span>
                            <span className="info-value">{booking.guests || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Total</span>
                            <span className="info-value">₹{booking.total}</span>
                          </div>
                        </div>
                      </div>

                      <div className="booking-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => downloadBookingPDF(booking)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Download PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

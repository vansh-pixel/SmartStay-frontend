"use client"
import { useState, useRef, useEffect } from "react"
import RoomBookingModal from "./RoomBookingModal"
import { roomAPI } from "@/lib/api" // Import roomAPI
import "@/styles/rooms.css"

export default function Rooms({ onOpenAuth }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [cardsPerView, setCardsPerView] = useState(3)
  
  // State for fetched rooms
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomAPI.getAll();
        // Transform API data to match UI structure if needed
        // Assuming API returns array of room objects compatible with UI
        setRooms(data);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth <= 768) {
        setCardsPerView(1)
      } else if (window.innerWidth <= 1024) {
        setCardsPerView(2)
      } else {
        setCardsPerView(3)
      }
    }

    updateCardsPerView()
    window.addEventListener('resize', updateCardsPerView)
    return () => window.removeEventListener('resize', updateCardsPerView)
  }, [])

  const nextSlide = () => {
    if (isTransitioning || rooms.length === 0) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
    
    const timer = setTimeout(() => {
      if (currentIndex + 1 >= rooms.length) {
        setIsTransitioning(false)
        setCurrentIndex(0)
      } else {
        setIsTransitioning(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }

  const prevSlide = () => {
    if (isTransitioning || rooms.length === 0) return
    setIsTransitioning(true)
    if (currentIndex === 0) {
      setCurrentIndex(rooms.length - 1)
    } else {
      setCurrentIndex((prev) => prev - 1)
    }
    const timer = setTimeout(() => setIsTransitioning(false), 500)
    return () => clearTimeout(timer)
  }

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX)
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) nextSlide()
    if (touchStart - touchEnd < -75) prevSlide()
  }

  const handleBookNow = (room) => {
    const token = localStorage.getItem("jwtToken")
    if (!token) {
      if (onOpenAuth) onOpenAuth()
      return
    }
    setSelectedRoom(room)
  }

  const getIconSVG = (iconName) => {
    // Helper to map icon names (string) to SVG
    // If your DB stores full SVG or different names, adjust here.
    // For now assuming DB uses simple keys like "wifi", "ac", etc. OR we try to match loosely.
    const icons = {
      wifi: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>,
      ac: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2h8"></path><path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2"></path><path d="M7 15h10"></path></svg>,
      shower: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 2h6"></path><path d="M12 2v8"></path><path d="M6 10h12"></path><path d="M8 14v8"></path><path d="M12 14v8"></path><path d="M16 14v8"></path></svg>,
      tv: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>,
      users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    }
    // Default to 'users' if not found, or try to match based on label content
    return icons[iconName] || icons.users 
  }

  if (loading) return <div className="text-center py-20">Loading Rooms...</div>

  return (
    <section className="rooms-section">
      <div className="rooms-header">
        <div className="header-divider">
          <span className="line"></span>
          <span className="label">Our Rooms</span>
          <span className="line"></span>
        </div>
        <h2>
          Explore Our <span className="highlight">Rooms</span>
        </h2>
      </div>

      <div className="carousel-wrapper">
        <button className="carousel-arrow prev" onClick={prevSlide} aria-label="Previous room">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div
          className="carousel-container"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`carousel-track ${isTransitioning ? 'transitioning' : ''}`}
            style={{
              transform: `translateX(-${currentIndex * (100 / (cardsPerView || 1))}%)`,
            }}
          >
            {rooms.length > 0 ? rooms.map((room) => (
              <div key={room._id} className="room-card">
                <div className="room-image">
                  <img src={room.image} alt={room.name} />
                </div>
                <div className="room-content">
                  <h3 className="room-name">{room.name}</h3>
                  <div className="room-price">
                    <span className="price">
                      {typeof room.price === 'string' 
                        ? (room.price.includes('$') ? room.price.replace('$', '₹') : (room.price.includes('₹') ? room.price : `₹${room.price}`))
                        : `₹${room.price || room.basePrice}`}
                    </span>
                    <span className="period">/ per night</span>
                  </div>
                  <div className="divider"></div>
                  <div className="amenities">
                    {room.amenities && room.amenities.slice(0, 5).map((amenity, idx) => (
                      <div key={idx} className="amenity-item">
                        {/* Map amenity label/icon to SVG */}
                         <span className="amenity-icon">
                            {/* Assuming amenity.icon is a key like 'wifi' */}
                            {getIconSVG(amenity.icon || 'users')}
                         </span>
                        <span className="amenity-label">{amenity.label}</span>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary book-btn" onClick={() => handleBookNow(room)}>
                    Book Now
                  </button>
                </div>
              </div>
            )) : <div className="p-4 text-center w-full">No rooms available.</div>}
          </div>
        </div>

        <button className="carousel-arrow next" onClick={nextSlide} aria-label="Next room">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {selectedRoom && (
        <RoomBookingModal 
          isOpen={!!selectedRoom}
          room={selectedRoom} 
          onClose={() => setSelectedRoom(null)} 
        />
      )}
    </section>
  )
}
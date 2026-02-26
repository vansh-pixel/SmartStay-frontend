"use client"

import { useState, useEffect, useRef } from "react"
import "@/styles/about.css"

export default function About() {
  const [counts, setCounts] = useState({ years: 0, area: 0, rooms: 0, visitors: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const statsRef = useRef(null)
  const timersRef = useRef([])

  const stats = [
    { key: "years", target: 8, label: "Years of Service" },
    { key: "area", target: 459, label: "Sq. Meter Area" },
    { key: "rooms", target: 50, label: "Nice Rooms" },
    { key: "visitors", target: 3786, label: "Happy Visitors" },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          animateCounters()
        } else {
          setIsVisible(false)
          resetCounters()
        }
      },
      { threshold: 0.3 }
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => {
      // Cleanup: disconnect observer and clear all timers
      observer.disconnect()
      clearAllTimers()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const clearAllTimers = () => {
    timersRef.current.forEach(timer => clearInterval(timer))
    timersRef.current = []
  }

  const resetCounters = () => {
    clearAllTimers()
    setCounts({ years: 0, area: 0, rooms: 0, visitors: 0 })
  }

  const animateCounters = () => {
    // Clear any existing timers before starting new ones
    clearAllTimers()
    const duration = 1800
    const steps = 60
    const interval = duration / steps

    stats.forEach((stat) => {
      let current = 0
      const increment = stat.target / steps

      const timer = setInterval(() => {
        current += increment
        if (current >= stat.target) {
          setCounts((prev) => ({ ...prev, [stat.key]: stat.target }))
          clearInterval(timer)
          // Remove timer from ref after clearing
          timersRef.current = timersRef.current.filter(t => t !== timer)
        } else {
          setCounts((prev) => ({ ...prev, [stat.key]: Math.floor(current) }))
        }
      }, interval)
      
      timersRef.current.push(timer)
    })
  }

  return (
    <section className="about-section">
      <div className="about-container">
        {/* Section 1: Image Left, Text Right */}
        <div className="about-row">
          <div className="about-image">
            <img
              src="https://images.unsplash.com/photo-1505691938895-1758d7feb511"
              alt="Modern hotel architecture"
            />
          </div>
          <div className="about-content">
            <span className="about-label">About Us</span>
            <h2>
              History of <span className="brand-smart">Smart</span><span className="brand-stay">Stay</span>
            </h2>
            <p className="primary-text">
              At Hotel SmartStay, we have been committed to providing exceptional hospitality for over 8 years. Our journey began with a simple mission: to create a welcoming space where guests feel at home while enjoying world-class amenities and services.
            </p>
            <p className="secondary-text">
              From our humble beginnings, we have grown into one of Ahmedabad's most trusted hotel destinations, serving thousands of satisfied guests annually with warmth and dedication.
            </p>
            <button className="read-more-btn">Read More</button>
          </div>
        </div>

        {/* Section 2: Text Left, Image Right */}
        <div className="about-row reverse">
          <div className="about-content">
            <h2>Why Choose Us?</h2>
            <p className="primary-text">
              We stand out from the competition through our unwavering commitment to excellence. Our team goes the extra mile to ensure every guest receives personalized attention, cutting-edge technology, and exceptional service that exceeds expectations.
            </p>
            <p className="secondary-text">
              With a strategic location, modern facilities, and highly trained staff, Hotel SmartStay offers the perfect blend of comfort, convenience, and luxury. We're not just a place to stay—we're your home away from home.
            </p>
            <button className="read-more-btn">Read More</button>
          </div>
          <div className="about-image">
            <img
              src="https://images.unsplash.com/photo-1523217582562-09d0def993a6"
              alt="Luxury hotel interior"
            />
          </div>
        </div>
      </div>

      {/* Statistics Counter Section */}
      <div className="stats-section-wrapper">
        <div className={`stats-section ${isVisible ? 'visible' : ''}`} ref={statsRef}>
          <div className="stats-container">
            {stats.map((stat) => (
              <div key={stat.key} className="stat-item">
                <div className="stat-number">{counts[stat.key]}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"
import { useState } from "react"
import { Maximize2, X } from "lucide-react"
import "@/styles/footer.css"

export default function Footer() {
  const [isMapOpen, setIsMapOpen] = useState(false)
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>SmartStay</h3>
          <p>Providing exceptional hospitality in Ahmedabad since 2016.</p>
          <p className="contact-info">vanshmamtora17@gmail.com</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="#home">Home</a>
            </li>
            <li>
              <a href="#about">About Us</a>
            </li>
            <li>
              <a href="#rooms">Rooms</a>
            </li>
            <li>
              <a href="#services">Services</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Location</h4>
          <div className="footer-map-container">
            <iframe
              title="Ahmedabad Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117506.382824461!2d72.507625!3d23.012033!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fccddf610bb2fe2!2sAhmedabad%2C%20Gujarat!5e1!3m2!1sen!2sin!4v1710310000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            <div className="map-overlay">
              <button className="full-screen-btn" onClick={() => setIsMapOpen(true)}>
                <Maximize2 size={16} />
                <span>Full Screen</span>
              </button>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <h4>Follow Us</h4>
          <ul>
            <li>
              <a href="#social">Facebook</a>
            </li>
            <li>
              <a href="#social">Instagram</a>
            </li>
            <li>
              <a href="#social">Twitter</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Hotel SmartStay. All rights reserved.</p>
      </div>

      {isMapOpen && (
        <div className="map-modal-overlay" onClick={() => setIsMapOpen(false)}>
          <div className="map-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="map-modal-header">
              <h3>Our Location - Ahmedabad</h3>
              <button className="close-btn" onClick={() => setIsMapOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="map-modal-body">
              <iframe
                title="Ahmedabad Map Large"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117506.382824461!2d72.507625!3d23.012033!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fccddf610bb2fe2!2sAhmedabad%2C%20Gujarat!5e1!3m2!1sen!2sin!4v1710310000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
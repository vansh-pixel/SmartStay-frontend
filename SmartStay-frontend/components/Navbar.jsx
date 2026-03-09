"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { authAPI } from "@/lib/api"
import AuthModal from "./AuthModal"
import ProfileModal from "./ProfileModal"
import "@/styles/navbar.css"
import { ThemeToggle } from "./ThemeToggle"
import { motion, AnimatePresence } from "framer-motion"

const Navbar = forwardRef((props, ref) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const [authMode, setAuthMode] = useState("user") // "user" or "admin"

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    // Check for JWT token in localStorage
    const token = localStorage.getItem("jwtToken")
    setIsLoggedIn(!!token)
    
    // Get user name from localStorage
    if (token) {
      const storedName = localStorage.getItem("userName")
      setUserName(storedName || "User")
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Call logout API
      await authAPI.logout()
      setIsLoggedIn(false)
      setUserName("")
      setIsProfileDropdownOpen(false)
      
      // Show toast notification
      const toast = document.createElement("div")
      toast.className = "toast toast-success"
      toast.textContent = "Logged out successfully"
      document.body.appendChild(toast)

      setTimeout(() => {
        toast.classList.add("show")
      }, 100)

      setTimeout(() => {
        toast.classList.remove("show")
        setTimeout(() => {
          document.body.removeChild(toast)
        }, 300)
      }, 3000)
    } catch (error) {
      // Even if API fails, clear local token
      localStorage.removeItem("jwtToken")
      localStorage.removeItem("userName")
      setIsLoggedIn(false)
      setUserName("")
      setIsProfileDropdownOpen(false)
    }
  }

  const handleAuthModalClose = (authSuccess = false) => {
    setIsAuthModalOpen(false)
    // Only update login state if authentication was successful
    if (authSuccess) {
      // Double-check that token exists in localStorage
      const token = localStorage.getItem("jwtToken")
      setIsLoggedIn(!!token)
      
      // Get user name
      const storedName = localStorage.getItem("userName")
      setUserName(storedName || "User")
    }
  }

  // Expose openAuthModal method to parent via ref
  useImperativeHandle(ref, () => ({
    openAuthModal: () => {
      setIsAuthModalOpen(true)
    }
  }))

  const handleNavClick = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen)
  }

  const openProfileModal = () => {
    setIsProfileModalOpen(true)
    setIsProfileDropdownOpen(false)
  }

  const closeProfileModal = () => {
    setIsProfileModalOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileDropdownOpen])

  const navLinks = [
    { name: "Home", id: "home" },
    { name: "About", id: "about" },
    { name: "Rooms", id: "rooms" },
    { name: "Services", id: "services" },
    { name: "Events", id: "events", isExternal: true },
    { name: "Contact", id: "testimonials" },
  ]

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`navbar ${isScrolled ? "scrolled" : ""}`}
    >
      <div className="navbar-container">
        <div className="navbar-logo">
          <h1>
            <span className="logo-smart">Smart</span>
            <span className="logo-stay">Stay</span>
          </h1>
        </div>

        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <span className={isMobileMenuOpen ? "active" : ""}></span>
          <span className={isMobileMenuOpen ? "active" : ""}></span>
          <span className={isMobileMenuOpen ? "active" : ""}></span>
        </button>

        <ul className={`nav-menu ${isMobileMenuOpen ? "active" : ""}`}>
          {navLinks.map((link) => (
            <li key={link.id}>
              {link.isExternal ? (
                <a href="/events" className="relative group">
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ) : (
                <a
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavClick(link.id)
                  }}
                  className="relative group"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
              )}
            </li>
          ))}

          {/* Mobile Only Auth Items */}
          {isLoggedIn ? (
            <>
              <li className="mobile-only">
                <a href="#" onClick={(e) => { e.preventDefault(); openProfileModal(); setIsMobileMenuOpen(false); }}>
                  My Profile
                </a>
              </li>
              <li className="mobile-only">
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); setIsMobileMenuOpen(false); }}>
                  Logout
                </a>
              </li>
            </>
          ) : (
            <>
              <li className="mobile-only">
                <a href="#" onClick={(e) => { 
                  e.preventDefault(); 
                  setAuthMode("user");
                  setIsAuthModalOpen(true); 
                  setIsMobileMenuOpen(false);
                }}>
                  Login / Signup
                </a>
              </li>
              <li className="mobile-only">
                <a href="#" onClick={(e) => { 
                  e.preventDefault(); 
                  setAuthMode("admin");
                  setIsAuthModalOpen(true); 
                  setIsMobileMenuOpen(false);
                }} style={{ color: '#ff8c42' }}>
                  Admin Portal
                </a>
              </li>
            </>
          )}


        </ul>

        {isLoggedIn ? (
          <div className="profile-dropdown-container flex items-center gap-4">
            <button className="profile-btn" onClick={toggleProfileDropdown}>
              <div className="profile-avatar-small">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="profile-name">{userName}</span>
              <motion.svg
                animate={{ rotate: isProfileDropdownOpen ? 180 : 0 }}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </motion.svg>
            </button>

            <AnimatePresence>
              {isProfileDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="profile-dropdown"
                >
                  <button className="dropdown-item" onClick={openProfileModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    My Profile
                  </button>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <ThemeToggle />
          </div>
        ) : (
          <div className="auth-buttons" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="logout-btn hover:scale-105 transition-transform" 
              onClick={() => {
                setAuthMode("user");
                setIsAuthModalOpen(true);
              }}
            >
              Login/Signup
            </button>
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "#ff8c42", color: "#fff" }}
              whileTap={{ scale: 0.95 }}
              className="admin-login-btn"
              onClick={() => {
                setAuthMode("admin");
                setIsAuthModalOpen(true);
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #ff8c42',
                color: '#ff8c42',
                padding: '8px 16px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Admin
            </motion.button>
            <ThemeToggle />
          </div>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={handleAuthModalClose} mode={authMode} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={closeProfileModal} />
    </motion.nav>
  )
})
Navbar.displayName = "Navbar"
export default Navbar
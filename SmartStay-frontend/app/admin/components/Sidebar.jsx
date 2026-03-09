"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import AdminDevMode from './AdminDevMode'

export default function Sidebar() {
  const pathname = usePathname()
  const [isDevModeOpen, setIsDevModeOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      window.location.href = '/'
    } catch (error) {
      console.error("Logout failed:", error)
      // Force redirect
      window.location.href = '/'
    }
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    )},
    { name: 'Bookings', href: '/admin/bookings', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )},
    { name: 'Rooms', href: '/admin/rooms', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    )},
  ];

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        width: '260px',
        backgroundColor: '#fff', 
        color: '#333',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        borderRight: '1px solid #eee',
        boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
        zIndex: 100
      }}
    >
      <div style={{ marginBottom: '48px', paddingLeft: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', letterSpacing: '-0.5px' }}>
          <span style={{ color: '#ff8c42' }}>Smart</span>Stay
          <span style={{ fontSize: '12px', display: 'block', color: '#999', fontWeight: '500', marginTop: '4px', letterSpacing: '1px' }}>ADMIN PANEL</span>
        </h2>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: isActive ? '#fff' : '#666',
                    backgroundColor: isActive ? '#ff8c42' : 'transparent',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => {
                    if(!isActive) {
                      e.currentTarget.style.backgroundColor = '#fff7f0'
                      e.currentTarget.style.color = '#ff8c42'
                    }
                  }}
                  onMouseOut={(e) => {
                    if(!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#666'
                    }
                  }}
                >
                  {item.icon}
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '24px' }}>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#dc3545',
            cursor: 'pointer',
            fontSize: '16px',
            borderRadius: '12px',
            transition: 'background-color 0.2s ease',
            fontWeight: '500'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#fff0f0'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
      
      {/* Admin Developer Tools Button */}
      <div style={{ marginTop: '16px' }}>
        <button 
          onClick={() => setIsDevModeOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#0ea5e9',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            borderRadius: '12px',
            transition: 'opacity 0.2s ease',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)'
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.9'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
          </svg>
          Developer Tools
        </button>
      </div>

      <AdminDevMode isOpen={isDevModeOpen} onClose={() => setIsDevModeOpen(false)} />
    </motion.div>
  )
}

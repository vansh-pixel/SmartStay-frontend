"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle({ className, ...props }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className={`theme-toggle-skeleton ${className || ""}`} aria-hidden="true">
        <span className="sr-only">Toggle theme</span>
      </button>
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      className={`theme-toggle-btn ${className || ""}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      {...props}
    >
      <div className="toggle-track">
        <motion.div
          className="toggle-thumb"
          layout
          transition={{
            type: "spring",
            stiffness: 700,
            damping: 30
          }}
          style={{
            justifyContent: isDark ? "flex-end" : "flex-start"
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? "dark" : "light"}
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="theme-icon moon"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="theme-icon sun"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      <style jsx>{`
        .theme-toggle-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          height: 36px;
          width: 64px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .theme-toggle-btn:hover {
          border-color: #ff8c42;
          background: rgba(255, 255, 255, 0.05);
        }

        /* Dark mode styles for button */
        :global(.dark) .theme-toggle-btn {
          border-color: rgba(255, 255, 255, 0.1);
        }
        :global(.dark) .theme-toggle-btn:hover {
          border-color: #ff8c42;
          background: rgba(255, 255, 255, 0.05);
        }
        
        /* Mobile specific style adjustment */
        .theme-toggle-btn.mobile {
           width: auto;
           height: auto;
           border: none;
           padding: 10px;
        }
        
        .theme-toggle-btn.mobile .toggle-track {
           display: none; 
        }

        .toggle-track {
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: ${isDark ? 'flex-end' : 'flex-start'};
        }

        .toggle-thumb {
          width: 26px;
          height: 26px;
          background: #ff8c42; /* Brand orange */
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        /* Skeleton loading state */
        .theme-toggle-skeleton {
          width: 64px;
          height: 36px;
          background: rgba(255,255,255,0.1);
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </button>
  )
}

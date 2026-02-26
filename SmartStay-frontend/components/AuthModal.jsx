"use client"
import { useState, useEffect } from "react"
import { GoogleLogin } from '@react-oauth/google';
import Link from "next/link"; 
import { authAPI } from "@/lib/api"
import "@/styles/AuthModal.css"

export default function AuthModal({ isOpen, onClose, mode = 'user' }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Force login mode if admin (DEPRECATED: User now wants Admin Signup)
  // useEffect(() => {
  //   if (mode === 'admin') {
  //     setIsLogin(true);
  //   }
  // }, [mode, isOpen]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await authAPI.googleLogin(credentialResponse.credential);
      
      // Check Admin
      if (data.isAdmin) {
        localStorage.setItem("adminToken", data.token); // Store as adminToken
        localStorage.setItem("isAdmin", "true");
        window.location.href = "/admin";
        return;
      } else {
        localStorage.setItem('jwtToken', data.token); // Store as normal token
        localStorage.removeItem("isAdmin");
      }
      
      showToast("Login successful!", "success");

      setTimeout(() => {
         window.location.reload(); 
      }, 1000);
      onClose(true);

    } catch (error) {
      console.error("Google Login Failed", error);
      showToast("Google Login Failed. Please try again.", "error");
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all states when modal is closed
      setIsLogin(true)
      setFormData({ email: "", password: "", confirmPassword: "" })
      setErrors({})
      setIsLoading(false)
      setIsFlipping(false)
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Handle modal close with state cleanup
  const handleClose = () => {
    // Reset all states before closing
    setIsLogin(true)
    setFormData({ email: "", password: "", confirmPassword: "" })
    setErrors({})
    setIsLoading(false)
    setIsFlipping(false)
    setShowPassword(false)
    setShowConfirmPassword(false)

    // Call parent's onClose
    onClose(false)
  }

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const showToast = (message, type = "success") => {
    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`
    toast.textContent = message
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    // Clear any previous errors
    setErrors({})

    try {
      let response
      
      if (isLogin) {
        response = await authAPI.login(formData.email, formData.password)
      } else {
        // Pass isAdminSignup=true if in admin mode
        response = await authAPI.signup(
          formData.email.split('@')[0], // Use part of email as name for simplicity or add name field
          formData.email,
          formData.password,
          mode === 'admin' // isAdminSignup flag
        )
      }

      // Store JWT token and user info
      if (response.token) {
        if (response.isAdmin || (response.user && response.user.isAdmin)) {
             localStorage.setItem("adminToken", response.token);
             localStorage.setItem("isAdmin", "true");
        } else {
             localStorage.setItem("jwtToken", response.token);
             localStorage.removeItem("isAdmin");
        }
      }
      // Store user name (extract from email or use response data)
      if (response.user && response.user.name) {
        localStorage.setItem("userName", response.user.name)
      } else if (response.name) {
        localStorage.setItem("userName", response.name)
      } else {
        // Fallback: use email username part
        const userName = formData.email.split('@')[0]
        localStorage.setItem("userName", userName)
      }

      // 🚨 CHECK ADMIN & REDIRECT 🚨
      if (response.isAdmin || (response.user && response.user.isAdmin)) {
        localStorage.setItem("isAdmin", "true"); // Save admin flag
        window.location.href = "/admin"; // Force reload to admin
        return; 
      } else {
        localStorage.removeItem("isAdmin"); // Ensure no residual admin flag
      }

      // If user is NOT admin but tried to login via Admin Modal...
      if (mode === 'admin') {
         showToast("You are not an admin. Logged in as User.", "warning");
      } else {
        showToast(
            isLogin ? "Login successful!" : "Account created successfully!",
            "success"
        )
      }

      // Reset form
      setFormData({ email: "", password: "", confirmPassword: "" })
      setErrors({})

      // Close modal after short delay
      setTimeout(() => {
        onClose(true) // Pass true to indicate successful auth
      }, 1000)

    } catch (error) {
      const errorMessage = error.message || "Authentication failed. Please try again."
      showToast(errorMessage, "error")
      setErrors({ form: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const switchMode = () => {
    setIsFlipping(true)
    setTimeout(() => {
      setIsLogin(!isLogin)
      setFormData({ email: "", password: "", confirmPassword: "" })
      setErrors({})
      setShowPassword(false)
      setShowConfirmPassword(false)
    }, 400)
    setTimeout(() => {
      setIsFlipping(false)
    }, 800)
  }

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className={`auth-modal-container ${isFlipping ? 'flipping' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="auth-modal-content">
          <div className="auth-modal-header">
            {mode === 'admin' ? (
              <>
                <h2 style={{ color: '#ff8c42' }}>Admin Portal</h2>
                <p>Secure login for administrators</p>
              </>
            ) : (
              <>
                <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
                <p>{isLogin ? "Login to your account" : "Sign up to get started"}</p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.form && (
              <div className="form-error-banner" style={{
                padding: '12px',
                marginBottom: '16px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                fontSize: '14px'
              }}>
                {errors.form}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? "error" : ""}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={errors.password ? "error" : ""}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Forgot Password Link (Only shows in Login mode) */}
            {isLogin && (
              <div style={{ textAlign: "right", marginTop: "8px", marginBottom: "15px" }}>
                <Link 
                  href="/forgot-password" 
                  onClick={handleClose} 
                  style={{ 
                    color: "#ff6b35", 
                    fontSize: "0.9rem", 
                    textDecoration: "none",
                    fontWeight: "500"
                  }}
                >
                  Forgot Password?
                </Link>
              </div>
            )}

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={errors.confirmPassword ? "error" : ""}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword}</span>
                )}
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : isLogin ? (
                mode === 'admin' ? "Admin Login" : "Login"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* HIDE GOOGLE & SWITCH IF ADMIN */}
          {mode !== 'admin' && (
            <>
              <div className="auth-divider">
                <span>OR</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '15px' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    showToast("Google Login Failed", "error");
                  }}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  width="320"
                />
              </div>

              <div className="auth-switch">
                <p>
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button type="button" onClick={switchMode}>
                    {isLogin ? "Sign Up" : "Login"}
                  </button>
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
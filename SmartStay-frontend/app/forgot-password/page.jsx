"use client";
import { useState } from 'react';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import "@/styles/roombooking.css"; // Import your styles so 'btn-primary' works

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await authAPI.forgotPassword(email);
      setStatus({ 
        type: 'success', 
        message: 'Email sent! Check your inbox.' 
      });
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Something went wrong.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-modal-container" style={{ margin: '100px auto', maxWidth: '450px', position: 'relative' }}>
      <div className="booking-content step-2">
        <div className="guest-form-section">
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Forgot Password</h2>
          
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px' }}>
            Enter your email to receive a reset link.
          </p>

          {status.message && (
            <div className={`error-message ${status.type === 'success' ? 'success' : ''}`} style={{
              backgroundColor: status.type === 'success' ? '#e6fffa' : '#fee',
              borderColor: status.type === 'success' ? '#38a169' : '#fcc',
              color: status.type === 'success' ? '#2c7a7b' : '#c33',
              marginBottom: '20px'
            }}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="guest-form">
            <div className="form-row">
              <div className="form-group" style={{ width: '100%' }}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="step-actions" style={{ flexDirection: 'column', gap: '15px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </button>
              
              <Link href="/login" style={{ width: '100%', textAlign: 'center' }}>
                <button type="button" className="btn btn-secondary" style={{ width: '100%' }}>
                  Back to Login
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
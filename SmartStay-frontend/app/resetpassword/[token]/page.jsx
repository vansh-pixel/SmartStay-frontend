"use client";
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import "@/styles/roombooking.css"; // Import your styles

export default function ResetPasswordPage({ params }) {
  const { token } = use(params);
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await authAPI.resetPassword(token, password);
      setStatus({ type: 'success', message: 'Password updated! Redirecting...' });
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Invalid or expired token.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-modal-container" style={{ margin: '100px auto', maxWidth: '450px', position: 'relative' }}>
      <div className="booking-content step-2">
        <div className="guest-form-section">
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Set New Password</h2>

          {status.message && (
            <div className="error-message" style={{
              backgroundColor: status.type === 'success' ? '#e6fffa' : '#fee',
              color: status.type === 'success' ? '#2c7a7b' : '#c33',
              marginBottom: '20px'
            }}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="guest-form">
            <div className="form-row">
              <div className="form-group" style={{ width: '100%' }}>
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ width: '100%' }}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="step-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
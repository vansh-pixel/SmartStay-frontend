"use client"
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { bookingAPI } from '@/lib/api';

export default function CheckoutForm({ bookingData, onSuccess, onError, onSubmitApi }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !isReady) return;

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, 
        },
        redirect: "if_required",
      });

      if (error) {
        setMessage(error.message);
        if (onError) onError(error.message);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        try {
          // Payment success! Now create the booking in DB
          if (onSubmitApi) {
            await onSubmitApi(bookingData);
          } else {
            // Fallback for backward compatibility
            await bookingAPI.create(bookingData);
          }
          if (onSuccess) onSuccess(); 
        } catch (err) {
          setMessage("Payment succeeded, but booking failed to save.");
          console.error(err);
        }
      }
    } catch (e) {
      console.error("Stripe confirmPayment error:", e);
      setMessage("An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
      <PaymentElement onReady={() => setIsReady(true)} />
      {message && <div style={{ color: "#c33", marginTop: "10px", fontSize: "14px" }}>{message}</div>}
      
      <button 
        disabled={isProcessing || !stripe || !elements || !isReady} 
        className="btn btn-primary"
        style={{ marginTop: '20px', width: '100%' }}
      >
        {isProcessing ? "Processing..." : `Pay ₹${bookingData.pricing.total.toFixed(2)}`}
      </button>
    </form>
  );
}
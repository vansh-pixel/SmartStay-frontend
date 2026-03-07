"use client"
import { useState, useEffect } from 'react';
import { roomAPI, bookingAPI, paymentAPI } from '@/lib/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import "../styles/roombooking.css"; // Reuse styling where possible or create new
import { motion, AnimatePresence } from 'framer-motion';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Inner component for Stripe Form
const AdminStripeForm = ({ onSuccess, onCancel, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (submitError) {
      console.error("Stripe Confirm Error:", submitError);
      setError(submitError.message || "An unexpected error occurred.");
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        await onSuccess(paymentIntent);
      } catch (err) {
        console.error("Booking creation failed:", err);
        setError("Booking creation failed after payment.");
      }
      setProcessing(false);
    } else {
      setProcessing(false);
      setError("Payment failed or required further action.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg">
        <PaymentElement />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex justify-end gap-3 mt-4">
        <button type="button" onClick={onCancel} disabled={processing} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
        <button type="submit" disabled={!stripe || processing} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
          {processing ? "Processing..." : `Charge ₹${amount}`}
        </button>
      </div>
    </form>
  );
};

export default function AdminBookingModal({ isOpen, onClose, onBookingCreated }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [dates, setDates] = useState([null, null]);
  const [startDate, endDate] = dates;
  const [guestDetails, setGuestDetails] = useState({ fullName: '', email: '', phone: '', adults: 1, children: 0 });
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, qr, stripe
  const [clientSecret, setClientSecret] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen]);

  const fetchRooms = async () => {
    try {
      const data = await roomAPI.getAll();
      setRooms(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoomChange = (e) => {
    const val = e.target.value;
    console.log("Selected Room ID (raw):", val);
    setSelectedRoom(val);
    setDates([null, null]); // Reset dates
    setClientSecret(null); // Reset stripe payment
  };

  // Calculate Price
  useEffect(() => {
    if (selectedRoom && startDate && endDate) {
      console.log("Rooms available:", rooms);
      // Try finding by string comparison first to be safe
      const room = rooms.find(r => r.id == selectedRoom) || rooms.find(r => r._id == selectedRoom);
      
      console.log("Found Room:", room);
      
      if (room) {
        let nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (nights === 0) nights = 1; // Minimum 1 night
        
        let price = room.price;
        console.log("Raw Price:", price, "Type:", typeof price);

        // Robust parsing: convert to string, remove non-numeric chars (except dot), parse
        if (typeof price === 'string') {
           price = parseFloat(price.replace(/[^0-9.]/g, ''));
        }
        console.log("Parsed Price:", price);
        
        const total = price * nights;
        console.log("Calculated Total:", total);
        setTotalPrice(total);
      } else {
        console.error("Room not found for ID:", selectedRoom);
      }
    }
  }, [selectedRoom, startDate, endDate, rooms]);

  const handleCreateBooking = async (paymentIntentId = null, methodOverride = null) => {
    try {
      setLoading(true);
      // Use loose comparison to support both string and number IDs
      const room = rooms.find(r => r.id == selectedRoom) || rooms.find(r => r._id == selectedRoom);
      if (!room) {
        alert("Please select a valid room.");
        setLoading(false);
        return;
      }
      
      if (!startDate || !endDate) {
        alert("Please select check-in and check-out dates.");
        setLoading(false);
        return;
      }

      if (!guestDetails.fullName || !guestDetails.email || !guestDetails.phone) {
         alert("Please fill in all guest details (Name, Email, Phone).");
         setLoading(false);
         return;
      }

      let nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (nights === 0) nights = 1;

      // Prefer basePrice for calculations
      let price = room.basePrice !== undefined ? room.basePrice : room.price;
      
      if (typeof price === 'string') {
          price = parseFloat(price.replace(/[^0-9.]/g, ''));
      }

      const currentMethod = methodOverride || paymentMethod;

      const bookingData = {
        roomId: selectedRoom,
        checkIn: startDate,
        checkOut: endDate,
        guestDetails,
        pricing: {
          perNight: price,
          nights,
          total: totalPrice // Already calculated state
        },
        paymentStatus: paymentIntentId ? 'paid' : (currentMethod === 'pending' ? 'pending' : 'paid'),
        paymentMethod: paymentIntentId ? 'stripe' : currentMethod
      };

      await bookingAPI.createAdminBooking(bookingData);
      
      alert("Booking Created Successfully!");
      onBookingCreated();
      onClose();
    } catch (error) {
      alert("Failed to create booking: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initiate Stripe Payment
  const initializeStripe = async () => {
    if (!selectedRoom || !startDate || !endDate) return alert("Please select room and dates first.");
    if (totalPrice <= 0) return alert("Total price must be greater than ₹0.");
    
    setLoading(true);
    try {
      let nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (nights === 0) nights = 1;
      
      const { clientSecret } = await paymentAPI.createPaymentIntent(selectedRoom, nights);
      setClientSecret(clientSecret);
    } catch (error) {
      console.error("Stripe Init Failed:", error);
      alert("Failed to initialize Stripe payment.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
         <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">New Admin Booking</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Room</label>
                  <select 
                    value={selectedRoom} 
                    onChange={handleRoomChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">-- Choose Room --</option>
                    {rooms.map(room => {
                      // Formatting price for display
                      let priceVal = room.price;
                      if (typeof room.price === 'string') {
                         priceVal = parseFloat(room.price.replace(/[^0-9.]/g, ''));
                      }
                      
                      const roomIdVal = room.id || room._id;
                      return (
                        <option key={room._id || room.id} value={roomIdVal}>{room.name} (₹{priceVal}/night)</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dates</label>
                  <div className="border rounded-lg p-2">
                    <DatePicker
                      selectsRange={true}
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(update) => setDates(update)}
                      placeholderText="Check-in - Check-out"
                      className="w-full outline-none"
                      minDate={new Date()}
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                   <input 
                      type="text" 
                      value={guestDetails.fullName}
                      onChange={e => setGuestDetails({...guestDetails, fullName: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="John Doe"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Guest Phone</label>
                   <input 
                      type="tel" 
                      value={guestDetails.phone}
                      onChange={e => setGuestDetails({...guestDetails, phone: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="+1 234 567 8900"
                   />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Guest Email</label>
                   <input 
                      type="email" 
                      value={guestDetails.email}
                      onChange={e => setGuestDetails({...guestDetails, email: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="john@example.com"
                   />
                </div>
                 <div className="flex gap-4">
                    <div className="flex-1">
                       <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                       <input 
                          type="number" min="1"
                          value={guestDetails.adults}
                          onChange={e => setGuestDetails({...guestDetails, adults: e.target.value})}
                          className="w-full p-2 border rounded-lg"
                       />
                    </div>
                    <div className="flex-1">
                       <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                       <input 
                          type="number" min="0"
                          value={guestDetails.children}
                          onChange={e => setGuestDetails({...guestDetails, children: e.target.value})}
                          className="w-full p-2 border rounded-lg"
                       />
                    </div>
                 </div>

                 {totalPrice > 0 && (
                   <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-lg font-bold text-orange-600">Total: ₹{totalPrice}</p>
                   </div>
                 )}
              </div>

              {/* Right Column: Payment */}
              <div className="bg-gray-50 p-6 rounded-xl">
                 <h3 className="text-lg font-semibold mb-4 text-gray-800">Payment Method</h3>
                 
                 <div className="flex gap-2 mb-6">
                    {['cash', 'qr', 'stripe'].map(method => (
                       <button
                          key={method}
                          onClick={() => { setPaymentMethod(method); setClientSecret(null); }}
                          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                             paymentMethod === method 
                             ? 'bg-orange-500 text-white shadow-md' 
                             : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                       >
                          {method === 'qr' ? 'QR Code' : method.charAt(0).toUpperCase() + method.slice(1)}
                       </button>
                    ))}
                 </div>

                 {/* Method Specific Content */}
                 {paymentMethod === 'stripe' ? (
                    <div>
                       {!clientSecret ? (
                          <div className="text-center py-8">
                             <p className="text-sm text-gray-500 mb-4">Click below to load Credit Card terminal.</p>
                             <button 
                                onClick={initializeStripe}
                                disabled={!selectedRoom || !startDate || !endDate}
                                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                Load Terminal
                             </button>
                          </div>
                       ) : (
                          <Elements stripe={stripePromise} options={{ clientSecret }}>
                             <AdminStripeForm 
                                amount={totalPrice} 
                                onSuccess={(paymentIntent) => handleCreateBooking(paymentIntent.id)}
                                onCancel={() => setClientSecret(null)}
                             />
                          </Elements>
                       )}
                    </div>
                 ) : paymentMethod === 'qr' ? (
                    <div className="text-center">
                       <div className="bg-white p-4 inline-block rounded-lg shadow-sm border border-gray-200 mb-4">
                          {/* Placeholder Generic QR */}
                          <img 
                            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DisplayGenericPaymentQRHere" 
                            alt="Payment QR"
                            className="w-32 h-32 opacity-80"
                          />
                       </div>
                       <p className="text-sm text-gray-500 mb-4">Scan QR code to pay.</p>
                       <button 
                          onClick={() => handleCreateBooking()}
                          disabled={!selectedRoom || !startDate || !endDate || loading}
                          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                       >
                          {loading ? "Creating..." : "Mark as Paid & Book"}
                       </button>
                    </div>
                 ) : (
                    <div className="text-center py-4">
                       <p className="text-sm text-gray-500 mb-6">Confirm cash payment received from guest.</p>
                       <button 
                          onClick={() => handleCreateBooking()}
                          disabled={!selectedRoom || !startDate || !endDate || loading}
                          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                       >
                          {loading ? "Creating..." : "Mark as Paid & Book"}
                       </button>
                       <button 
                          onClick={() => { 
                            setPaymentMethod('pending'); 
                            // Slight delay to ensure state updates if needed, though direct passing is safer
                            handleCreateBooking(null, 'pending'); 
                          }}
                          disabled={!selectedRoom || !startDate || !endDate || loading}
                          className="mt-3 text-sm text-orange-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          Mark as Pending (Pay Later)
                       </button>
                    </div>
                 )}
              </div>
            </div>
         </div>
      </motion.div>
    </div>
  );
}

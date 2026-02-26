const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getMyBookings, 
  getBookingById,
  getBookedDates,
  createAdminBooking,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');

// All booking routes should be protected (require login)

// 0. Get booked dates (Public)
router.get('/availability/:roomId', getBookedDates);

// 0.1 Admin Manual Booking
router.post('/admin', protect, admin, createAdminBooking);

// 1. Create a new booking
router.post('/', protect, createBooking);

// 2. Get logged-in user's bookings
// (MUST be defined before /:id to avoid conflict)
router.get('/mybookings', protect, getMyBookings);

// 3. Get a specific booking by ID
router.get('/:id', protect, getBookingById);

// 4. Update Booking (Admin)
router.put('/:id', protect, admin, updateBooking);
router.delete('/:id', protect, admin, deleteBooking);

module.exports = router;
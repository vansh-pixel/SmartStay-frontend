const express = require('express');
const router = express.Router();
const { 
  getHalls, 
  getHallById, 
  createEventBooking, 
  getMyEventBookings,
  getBookedDates,
  updateEventBooking
} = require('../controllers/hallController');
const { protect, admin } = require('../middleware/authMiddleware'); // Assuming authMiddleware exists

router.get('/', getHalls);
router.get('/:id', getHallById);
router.post('/book', protect, createEventBooking);
router.get('/my-bookings', protect, getMyEventBookings);
router.get('/availability/:hallId', getBookedDates);
router.put('/bookings/:id', protect, admin, updateEventBooking); // Admin Route

module.exports = router;

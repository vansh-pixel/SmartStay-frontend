const express = require('express');
const router = express.Router();
const { createPaymentIntent, createEventPaymentIntent } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Route: POST /api/payment/create-payment-intent
// router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/create-payment-intent', createPaymentIntent); // TEMP: Testing without auth

// Route: POST /api/payment/create-event-payment-intent
router.post('/create-event-payment-intent', createEventPaymentIntent);

module.exports = router;
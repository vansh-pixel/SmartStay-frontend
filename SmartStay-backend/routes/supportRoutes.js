const express = require('express');
const router = express.Router();
const { chatbotResponse, contactSupport } = require('../controllers/supportController');

router.post('/chatbot', chatbotResponse);
router.post('/contact', contactSupport);

module.exports = router;
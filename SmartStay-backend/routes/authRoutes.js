// const express = require('express');
// const router = express.Router();
// const { 
//   registerUser, 
//   loginUser, 
//   getMe, 
//   googleLogin 
// } = require('../controllers/authController');

// const { protect } = require('../middleware/authMiddleware');

// router.post('/signup', registerUser);
// router.post('/login', loginUser);
// router.get('/me', getMe);
// router.post('/google', googleLogin)

// // Placeholder for Google Auth (requires more setup)
// router.get('/google', (req, res) => {
//     res.status(501).json({ message: "Google Auth not implemented yet" });
// });

// module.exports = router;







const express = require('express');
const router = express.Router();

// 1. Import all functions, including the new password ones
const { 
  registerUser, 
  loginUser, 
  getMe, 
  googleLogin,
  forgotPassword, // 👈 New
  resetPassword   // 👈 New
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// --- Authentication Routes ---
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);

// --- User Data Route ---
// ✅ FIX: Added 'protect' here. Without this, 'getMe' will crash because req.user will be null.
router.get('/me', protect, getMe);

// --- Password Reset Routes ---
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
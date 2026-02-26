require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Groq = require('groq-sdk');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const supportRoutes = require('./routes/supportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const hallRoutes = require('./routes/hallRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

//----MIDDLEWARE----
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://127.0.0.1:3000", 
    "http://localhost:3001", 
    "http://127.0.0.1:3001",
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// app.use('/api/auth', require('./routes/authRoutes')); // <--- This line enables /api/auth/google
// app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/admin', adminRoutes);
app.use('/api/halls', hallRoutes);
// app.use("/api/admin", adminAuth);


console.log("Starting server...");
try {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log("Groq initialized");
} catch (error) {
  console.error("Groq initialization failed:", error.message);
}

// --- DATABASE CONNECTION ---
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4, skip trying IPv6
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected! Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});


/**
 * @route   POST /api/chat
 * @desc    AI Chatbot using Groq (Llama3)
 */
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
   // SYSTEM PROMPT: Strict instructions for the AI
   const systemPrompt = `You are a helpful hotel assistant for 'SmartStay Hotel'. 
   Your goal is to assist guests with hotel-related questions.
   
   HOTEL DETAILS:
   - Name: SmartStay Hotel
   - Location: Downtown City Center
   - Check-in: 2:00 PM | Check-out: 11:00 AM
   - Amenities: Free Wi-Fi, Pool, Gym, Spa, Rooftop Bar
   - Room Rates: Deluxe ($120), Suite ($200)
   - Contact: support@smartstay.com | +1 234-567-8900
   
   INSTRUCTIONS:
   1. Answer ONLY questions related to the hotel (availability, amenities, times, location).
   2. If the user asks about general topics (math, history, coding), politely refuse and say you can only help with hotel queries.
   3. Keep answers concise and friendly.`;
 
   try {
     const chatCompletion = await groq.chat.completions.create({
       messages: [
         { role: "system", content: systemPrompt }, // The "Brain" instructions
         { role: "user", content: message },        // The user's message
       ],
       model: "llama-3.3-70b-versatile", // Fast & Free model on Groq
       temperature: 0.7, // Controls creativity (0.7 is balanced)
       max_tokens: 200,  // Limit response length
     });
 
     // Extract the answer
     const aiReply = chatCompletion.choices[0]?.message?.content || "I'm having trouble connecting right now.";
     
     res.json({ reply: aiReply });
 
   } catch (error) {
     console.error("Groq AI Error:", error);
     res.status(500).json({ error: "AI Service is currently unavailable." });
   }
 });

 app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});



// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const dotenv = require('dotenv');
// // Load environment variables
// dotenv.config();
// // Import database connection
// const connectDB = require('./db');
// // Import routes
// const authRoutes = require('./routes/auth');
// const bookingRoutes = require('./routes/bookings');
// const roomRoutes = require('./routes/rooms');
// const supportRoutes = require('./routes/support');
// const userRoutes = require('./routes/user');
// // Import middleware
// const { generalLimiter } = require('./middleware/rateLimit');
// // Connect to database
// connectDB();
// // Create Express app
// const app = express();
// // Security middleware
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" }
// }));
// // CORS configuration
// const corsOptions = {
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// };
// app.use(cors(corsOptions));
// // Rate limiting
// app.use('/api/', generalLimiter);
// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'SmartStay API is running',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });
// // API routes
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/bookings', bookingRoutes);
// app.use('/api/v1/rooms', roomRoutes);
// app.use('/api/v1/support', supportRoutes);
// app.use('/api/v1/user', userRoutes);
// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'NOT_FOUND',
//     message: `Route ${req.originalUrl} not found`,
//     code: 'ROUTE_NOT_FOUND'
//   });
// });
// // Global error handler
// app.use((err, req, res, next) => {
//   console.error('Global error handler:', err);
//   // Mongoose validation error
//   if (err.name === 'ValidationError') {
//     const errors = Object.values(err.errors).map(e => e.message);
//     return res.status(400).json({
//       success: false,
//       error: 'VALIDATION_ERROR',
//       message: 'Validation failed',
//       details: errors,
//       code: 'VALIDATION_ERROR'
//     });
//   }
//   // Mongoose duplicate key error
//   if (err.code === 11000) {
//     const field = Object.keys(err.keyValue)[0];
//     return res.status(409).json({
//       success: false,
//       error: 'CONFLICT',
//       message: `${field} already exists`,
//       code: 'DUPLICATE_KEY'
//     });
//   }
//   // JWT errors
//   if (err.name === 'JsonWebTokenError') {
//     return res.status(401).json({
//       success: false,
//       error: 'UNAUTHORIZED',
//       message: 'Invalid token',
//       code: 'INVALID_TOKEN'
//     });
//   }
//   if (err.name === 'TokenExpiredError') {
//     return res.status(401).json({
//       success: false,
//       error: 'UNAUTHORIZED',
//       message: 'Token expired',
//       code: 'TOKEN_EXPIRED'
//     });
//   }
//   // Default error
//   res.status(500).json({
//     success: false,
//     error: 'SERVER_ERROR',
//     message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
//     code: 'SERVER_ERROR'
//   });
// });
// // Start server
// const PORT = process.env.PORT || 8000;
// const server = app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
//   console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
//   console.log(`📊 Health check: http://localhost:${PORT}/health`);
// });
// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err, promise) => {
//   console.error('Unhandled Promise Rejection:', err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });
// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.error('Uncaught Exception:', err.message);
//   process.exit(1);
// });
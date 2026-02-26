// // 



// const jwt = require('jsonwebtoken');
// const asyncHandler = require('express-async-handler');
// const User = require('../models/User');
// const { OAuth2Client } = require('google-auth-library');
// const crypto = require('crypto'); // Built-in Node module for generating tokens
// const sendEmail = require('../utils/sendEmail'); // Import your email utility

// // Initialize Google Client
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// // Generate JWT
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: '30d',
//   });
// };

// // @desc    Register new user
// // @route   POST /api/auth
// // @access  Public
// const registerUser = asyncHandler(async (req, res) => {
//   const { name, email, password } = req.body;

//   if (!name || !email || !password) {
//     res.status(400);
//     throw new Error('Please add all fields');
//   }

//   // Check if user exists
//   const userExists = await User.findOne({ email });

//   if (userExists) {
//     res.status(400);
//     throw new Error('User already exists');
//   }

//   // Create user
//   // NOTE: Password hashing is now handled automatically in User.js pre-save middleware
//   const user = await User.create({
//     name,
//     email,
//     password, 
//   });

//   if (user) {
//     res.status(201).json({
//       _id: user.id,
//       name: user.name,
//       email: user.email,
//       token: generateToken(user._id),
//     });
//   } else {
//     res.status(400);
//     throw new Error('Invalid user data');
//   }
// });

// // @desc    Authenticate a user
// // @route   POST /api/auth/login
// // @access  Public
// const loginUser = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   // Check for user email and explicitly select password (since we set select: false in model)
//   const user = await User.findOne({ email }).select('+password');

//   // Use the matchPassword method from your User model
//   if (user && (await user.matchPassword(password))) {
//     res.json({
//       _id: user.id,
//       name: user.name,
//       email: user.email,
//       token: generateToken(user._id),
//     });
//   } else {
//     res.status(400);
//     throw new Error('Invalid credentials');
//   }
// });

// // @desc    Get user data
// // @route   GET /api/auth/me
// // @access  Private
// const getMe = asyncHandler(async (req, res) => {
//   res.status(200).json(req.user);
// });

// // @desc    Google Login
// // @route   POST /api/auth/google
// // @access  Public
// const googleLogin = asyncHandler(async (req, res) => {
//   const { token } = req.body;

//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const { name, email } = ticket.getPayload();

//     let user = await User.findOne({ email });

//     if (!user) {
//       // Create new user if they don't exist
//       // Using a complex dummy password since they authenticate via Google
//       // The pre-save middleware will hash this automatically
//       user = await User.create({
//         name,
//         email,
//         password: crypto.randomBytes(16).toString('hex'), 
//       });
//     }

//     res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       token: generateToken(user._id),
//     });

//   } catch (error) {
//     console.error("Google Login Error:", error);
//     res.status(401);
//     throw new Error('Google authentication failed');
//   }
// });

// // @desc    Forgot Password
// // @route   POST /api/auth/forgotpassword
// // @access  Public
// const forgotPassword = asyncHandler(async (req, res) => {
//   const user = await User.findOne({ email: req.body.email });

//   if (!user) {
//     res.status(404);
//     throw new Error('There is no user with that email');
//   }

//   // Get Reset Token
//   const resetToken = user.getResetPasswordToken();

//   // Save user with the new token (disable validation so we don't need to re-enter other fields)
//   await user.save({ validateBeforeSave: false });

//   // Create Reset URL
//   // This points to your FRONTEND page (e.g., localhost:3000)
//   const resetUrl = `${req.headers.origin}/resetpassword/${resetToken}`;

//   const message = `
//     <div style="font-family: Arial, sans-serif; padding: 20px;">
//       <h2>Password Reset Request</h2>
//       <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
//       <p>Please click the button below to reset your password:</p>
//       <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
//       <p>Or paste this link into your browser: <br/> <a href="${resetUrl}">${resetUrl}</a></p>
//       <p style="color: #666; margin-top: 20px;">This link will expire in 10 minutes.</p>
//       <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
//     </div>
//   `;

//   try {
//     await sendEmail({
//       email: user.email,
//       subject: 'Password Reset Token - SmartStay',
//       message,
//     });

//     res.status(200).json({ success: true, data: 'Email sent' });
//   } catch (err) {
//     console.error(err);
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;

//     await user.save({ validateBeforeSave: false });
//     res.status(500);
//     throw new Error('Email could not be sent');
//   }
// });

// // @desc    Reset Password
// // @route   PUT /api/auth/resetpassword/:resettoken
// // @access  Public
// const resetPassword = asyncHandler(async (req, res) => {
//   // Get hashed token
//   const resetPasswordToken = crypto
//     .createHash('sha256')
//     .update(req.params.resettoken)
//     .digest('hex');

//   const user = await User.findOne({
//     resetPasswordToken,
//     resetPasswordExpire: { $gt: Date.now() },
//   });

//   if (!user) {
//     res.status(400);
//     throw new Error('Invalid token');
//   }

//   // Set new password
//   user.password = req.body.password;
//   user.resetPasswordToken = undefined;
//   user.resetPasswordExpire = undefined;

//   // The pre-save middleware in User.js will hash this new password
//   await user.save();

//   res.status(200).json({
//     success: true,
//     token: generateToken(user._id),
//     message: 'Password updated successfully' 
//   });
// });

// module.exports = {
//   registerUser,
//   loginUser,
//   getMe,
//   googleLogin,
//   forgotPassword,
//   resetPassword,
// };


const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};



// ================= REGISTER =================
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, isAdminSignup } = req.body; // Added isAdminSignup flag

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  let isAdmin = false;

  // 👑 SINGLE USER ADMIN CHECK
  if (isAdminSignup) {
    const adminCount = await User.countDocuments({ isAdmin: true });
    if (adminCount > 0) {
      res.status(403);
      throw new Error('Admin registration is closed. An admin already exists.');
    }
    isAdmin = true;
  }

  const user = await User.create({
    name,
    email,
    password,
    isAdmin // Set based on check
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});



// ================= LOGIN =================
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,   // ✅ Added
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});



// ================= GET ME =================
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});



// ================= GOOGLE LOGIN =================
const googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(16).toString('hex'),
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,   // ✅ Added
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401);
    throw new Error('Google authentication failed');
  }
});



// ================= FORGOT PASSWORD =================
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    res.status(404);
    throw new Error('There is no user with that email');
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.headers.origin}/resetpassword/${resetToken}`;

  const message = `
    <h2>Password Reset</h2>
    <p>Please click below to reset password</p>
    <a href="${resetUrl}">Reset Password</a>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token - SmartStay',
      message,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error('Email could not be sent');
  }
});



// ================= RESET PASSWORD =================
const resetPassword = asyncHandler(async (req, res) => {

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    token: generateToken(user._id),
    message: 'Password updated successfully',
  });
});



module.exports = {
  registerUser,
  loginUser,
  getMe,
  googleLogin,
  forgotPassword,
  resetPassword,
};

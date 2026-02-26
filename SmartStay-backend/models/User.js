const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // 👈 Import bcrypt for password security
const crypto = require('crypto');   // 👈 Import crypto for reset tokens

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    // We make this optional since your form implies it might be extracted from email
    default: function() {
      // Auto-generate name from email if missing (e.g., "john" from "john@email.com")
      return this.email ? this.email.split('@')[0] : 'User'; 
    }
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    select: false, // Security: Don't return password by default in queries
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  
  // 👇 NEW FIELDS FOR PASSWORD RESET
  resetPasswordToken: String,
  resetPasswordExpire: Date

}, {
  timestamps: true,
});

// --- MIDDLEWARE 1: Encrypt Password before saving ---
userSchema.pre('save', async function(next) {
  // If password is not modified (e.g., we are just updating the name), skip hashing
  if (!this.isModified('password')) {
    return next();
  }
  // Generate salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// --- METHOD 1: Match User Password ---
// Used during Login to check if entered password matches hashed password in DB
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- METHOD 2: Generate Password Reset Token ---
userSchema.methods.getResetPasswordToken = function() {
  // 1. Generate a random long string (raw token)
  const resetToken = crypto.randomBytes(20).toString('hex');

  // 2. Hash it and save to database (Security best practice)
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 3. Set expiration (10 Minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  // 4. Return the RAW token (to send in the email)
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);





// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true,
//     match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
//   },
//   password: {
//     type: String,
//     required: function() {
//       return !this.googleId; // Password required only if not using Google OAuth
//     },
//     minlength: [6, 'Password must be at least 6 characters long']
//   },
//   name: {
//     type: String,
//     maxlength: [100, 'Name cannot exceed 100 characters']
//   },
//   phone: {
//     type: String,
//     match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
//   },
//   avatar: {
//     type: String, // URL to avatar image
//     maxlength: [500, 'Avatar URL cannot exceed 500 characters']
//   },
//   googleId: {
//     type: String,
//     sparse: true // Allows null values but ensures uniqueness when present
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   lastLogin: {
//     type: Date
//   },
//   emailVerified: {
//     type: Boolean,
//     default: false
//   }
// }, {
//   timestamps: true
// });

// // Index for efficient queries
// userSchema.index({ email: 1 });
// userSchema.index({ googleId: 1 });

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//   // Only hash the password if it has been modified (or is new)
//   if (!this.isModified('password') || !this.password) return next();

//   try {
//     // Hash password with cost of 12
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Method to compare password
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   if (!this.password) return false;
//   return bcrypt.compare(candidatePassword, this.password);
// };

// // Method to get user without password
// userSchema.methods.toJSON = function() {
//   const userObject = this.toObject();
//   delete userObject.password;
//   return userObject;
// };

// // Update last login
// userSchema.methods.updateLastLogin = function() {
//   this.lastLogin = new Date();
//   return this.save();
// };

// module.exports = mongoose.model('User', userSchema);

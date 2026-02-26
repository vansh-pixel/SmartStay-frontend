const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const setAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const email = process.argv[2];
    if (!email) {
      console.log('Usage: node setAdmin.js <email>');
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();
    console.log(`User ${user.name} (${user.email}) is now an Admin!`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

setAdmin();

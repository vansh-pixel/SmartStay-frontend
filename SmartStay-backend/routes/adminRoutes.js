const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAllBookings
} = require("../controllers/adminController");

const { protect, admin } = require("../middleware/authMiddleware");

router.get("/stats", protect, admin, getDashboardStats);
// router.get("/stats", getDashboardStats); // TEMP: Testing
router.get("/bookings", protect, admin, getAllBookings);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAllBookings,
  processAdminAICommand
} = require("../controllers/adminController");

const { protect, admin } = require("../middleware/authMiddleware");

router.get("/stats", protect, admin, getDashboardStats);
router.get("/bookings", protect, admin, getAllBookings);
router.post("/chat", protect, admin, processAdminAICommand);

module.exports = router;

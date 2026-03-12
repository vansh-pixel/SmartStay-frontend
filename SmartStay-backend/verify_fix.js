const mongoose = require('mongoose');

// Mock models for local testing
const Room = {
  findOne: async (query) => {
    console.log("Mock Room.findOne called with:", query);
    if (query.id === "1" || query.id === 1) return { _id: "objectId1", id: "1", name: "Executive Suite" };
    return null;
  },
  findById: async (id) => {
    console.log("Mock Room.findById called with:", id);
    if (id === "objectId1") return { _id: "objectId1", id: "1", name: "Executive Suite" };
    return null;
  }
};

const createPaymentIntentLogic = async (roomId) => {
  const mongooseMock = { Types: { ObjectId: { isValid: (id) => id === "objectId1" } } };
  let room = null;
  
  // 1. Try finding by ObjectId
  if (mongooseMock.Types.ObjectId.isValid(roomId)) {
    console.log("🔍 Testing logic: checking ObjectId lookup...");
    room = await Room.findById(roomId);
  }

  // 2. Try finding by String or Number custom ID
  if (!room) {
    console.log("🔍 Testing logic: checking String id lookup...");
    room = await Room.findOne({ id: String(roomId) });
  }
  
  if (!room && !isNaN(roomId)) {
    console.log("🔍 Testing logic: checking Number id lookup...");
    room = await Room.findOne({ id: Number(roomId) });
  }

  return room;
};

async function runTests() {
  console.log("Running ID Lookup Logic Tests...");

  // Test 1: String ID
  const room1 = await createPaymentIntentLogic("1");
  console.log("Test 1 (String ID '1'):", room1 && room1.name === "Executive Suite" ? "PASS" : "FAIL");

  // Test 2: Number ID (passed as string but handled)
  const room2 = await createPaymentIntentLogic(1);
  console.log("Test 2 (Number ID 1):", room2 && room2.name === "Executive Suite" ? "PASS" : "FAIL");

  // Test 3: ObjectId
  const room3 = await createPaymentIntentLogic("objectId1");
  console.log("Test 3 (ObjectId 'objectId1'):", room3 && room3.name === "Executive Suite" ? "PASS" : "FAIL");

  // Test 4: Missing room
  const room4 = await createPaymentIntentLogic("999");
  console.log("Test 4 (Missing ID '999'):", room4 === null ? "PASS" : "FAIL");

  console.log("\nALL TESTS COMPLETED.");
  process.exit(0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});

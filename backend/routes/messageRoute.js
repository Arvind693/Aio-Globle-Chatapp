const express = require("express");
const protect = require("../middleware/authMiddleware");
const { allMessages, sendMessage, deleteMessage, deleteMultipleMessages, markAsDelivered, markAsSeen } = require("../controllers/messageController");


const router = express.Router();

router.get("/:chatId",protect, allMessages);
router.post("/",protect, sendMessage);
router.delete('/:id', protect, deleteMessage);
router.delete('/', protect, deleteMultipleMessages);
router.put("/delivered/:messageId", protect, markAsDelivered);
router.put("/seen/:messageId", protect, markAsSeen);

module.exports = router;

// perfect
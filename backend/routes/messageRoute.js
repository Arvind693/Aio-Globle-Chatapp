const express = require("express");
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const protect = require("../middleware/authMiddleware");
const { allMessages, sendMessage, deleteMessage, deleteMultipleMessages, markAsDelivered, markAsSeen } = require("../controllers/messageController");
const { fetchNotification, deleteNotificationsForChat } = require("../controllers/notificationController");


const router = express.Router();

// Cloudinary Storage configuration for resume, skill icons, and project thumbnails
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const fileExtension = file.mimetype.split('/')[1]; // Get file extension (e.g., jpg, png, pdf)

        return {
            folder: 'aio-globel_messages_files', // Cloudinary folder for profile image
            format: fileExtension,
            public_id: `file_${Date.now()}`, // Include the extension in the public ID
        };
    },
});

// Configure multer with Cloudinary storage
const upload = multer({ storage: cloudinaryStorage });

router.get("/:chatId",protect, allMessages);
router.post("/",protect,upload.single('file'), sendMessage);
router.delete('/:id', protect, deleteMessage);
router.delete('/', protect, deleteMultipleMessages);
router.put("/delivered/:messageId", protect, markAsDelivered);
router.put("/seen/:messageId", protect, markAsSeen);
router.get('/fetch-notification/:id',fetchNotification);
router.delete("/delete-notification/:chatId", protect, deleteNotificationsForChat);

module.exports = router;

// perfect
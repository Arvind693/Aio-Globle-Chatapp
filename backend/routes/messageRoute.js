const express = require("express");
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const protect = require("../middleware/authMiddleware");
const { allMessages, sendMessage, deleteMessage, deleteMultipleMessages, markAsDelivered, markAsSeen } = require("../controllers/messageController");
const { fetchNotification, deleteNotificationsForChat, deleteNotificationByMessageId } = require("../controllers/notificationController");


const router = express.Router();


const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        try {
            const fileExtension = file.mimetype.split('/')[1];
            const fileType = file.mimetype.split("/")[0];
            const allowedFileTypes = ['audio', 'video', 'image', 'application'];

            if (!allowedFileTypes.includes(fileType)) {
                throw new Error(`Unsupported file type: ${fileType}`);
            }

            // Dynamic folder based on file type
            const folderName =
                fileType === 'audio'
                    ? 'aio-globel_audio_files' // Separate folder for audio
                    : 'aio-globel_messages_files'; // Default folder for other files

            // Use 'raw' resource type for audio for better compatibility
            const resourceType = fileType === 'audio' ? 'raw' : fileType === 'video' ? 'video' : 'auto';

            return {
                folder: folderName,
                format: fileExtension, // Ensure file extension matches MIME type
                public_id: `file_${Date.now()}`,
                resource_type: resourceType, // Set resource type dynamically
            };
        } catch (error) {
            console.error('Error in Cloudinary Storage configuration:', error.message);
            throw error;
        }
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
router.delete('/notification/:id',protect,deleteNotificationByMessageId);

module.exports = router;

// perfect
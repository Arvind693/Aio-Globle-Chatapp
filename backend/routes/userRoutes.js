const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary');
const protect = require('../middleware/authMiddleware');
const {loginUser, searchUsers, createChat, updateUserProfile, fetchUserPermissions } = require('../controllers/userController');
const router = express.Router();

// Cloudinary Storage configuration for resume, skill icons, and project thumbnails
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const fileExtension = file.mimetype.split('/')[1]; // Get file extension (e.g., jpg, png, pdf)

        return {
            folder: 'aio-globel_profile_image', // Cloudinary folder for profile image
            format: fileExtension,
            public_id: `file_${Date.now()}`, // Include the extension in the public ID
        };
    },
});

// Configure multer with Cloudinary storage
const upload = multer({ storage: cloudinaryStorage });

router.post('/login',loginUser);
router.get('/search',protect, searchUsers);
router.post('/chat', createChat);
router.put('/update-user',upload.single('profileImage'),protect,updateUserProfile);
router.get('/permissions/:id',fetchUserPermissions);

module.exports = router;
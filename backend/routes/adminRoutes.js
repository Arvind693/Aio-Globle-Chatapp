const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary');
const protect = require('../middleware/authMiddleware');
const { registerAdmin,
    loginAdmin,
    getAllUsers,
    getAllGroups,
    updatePermissions, 
    getAutoResponses,
    createAutoResponse,
    deleteAutoResponse,
    updateAutoResponse,
    registerUser,
    getUserById,
    searchUsers,
    removeAllowedContact,
    addAllowedContact} = require('../controllers/adminController');
const router = express.Router();

// Cloudinary Storage configuration for resume, skill icons, and project thumbnails
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const fileExtension = file.mimetype.split('/')[1]; // Get file extension (e.g., jpg, png, pdf)

        return {
            folder: 'aio-globel_Admin_profile_image', // Cloudinary folder for profile image
            format: fileExtension,
            public_id: `file_${Date.now()}`, // Include the extension in the public ID
        };
    },
});

// Configure multer with Cloudinary storage
const upload = multer({ storage: cloudinaryStorage });

router.post('/register', upload.single('profileImage'), registerAdmin);
router.post('/login', loginAdmin);
router.get('/users', getAllUsers);
router.get('/groups',protect, getAllGroups);
router.put('/permissions/:userId', updatePermissions)
router.get('/autoresponses',getAutoResponses);
router.post('/autoresponses',createAutoResponse);
router.delete('/autoresponses/:id',deleteAutoResponse);
router.put('/autoresponses/:id',updateAutoResponse);
router.get('/search',protect,searchUsers);
router.post('/registeruser',protect,registerUser);
router.get('/getuser/:id',protect,getUserById);
router.delete('/:userId/contacts/:contactId', removeAllowedContact);
router.put('/:userId/contacts', addAllowedContact);
// router.post('/chat', createChat);
// router.put('/update-user',upload.single('profileImage'),protect,updateUserProfile);

module.exports = router;
const express = require('express');
const router = express.Router();
const { fetchAllChats,
    accessChat,
    fetchChats,
    groupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
    deleteGroup,
    deleteChat,
    initializeAdminChats,
    fetchAllChatsForChatHistory
} = require('../controllers/chatController');
const User = require('../models/userModel');
const protect = require('../middleware/authMiddleware');

// Fetch all chats for a specific user
router.get('/user-chats/:userId', fetchAllChats);
router.get('/fetch-chat-history/:userId',fetchAllChatsForChatHistory);
router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.post('/initialize-admin-chats', protect, initializeAdminChats);
router.post('/group', protect, groupChat);
router.put('/rename-group', protect, renameGroup);
router.put('/group/add', protect, addToGroup);
router.put('/group/remove', protect, removeFromGroup);
router.delete('/group', protect, deleteGroup);
router.delete('/:id',protect, deleteChat);
module.exports = router;
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isMainAdmin:{type: Boolean, default: false},
    role: { type: String, default: 'User' },
    isOnline: { type: Boolean, default: false }, 

    // Profile image
    profileImage: {
        type: String,
        default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    },

    // Allowed contacts for direct messaging, set by Admin
    allowedContacts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],

    // Permissions assigned by Admin
    permissions: {
        canMessage: { type: Boolean, default: false },
        canGroupChat: { type: Boolean, default: false },
        canScreenShare: { type: Boolean, default: false },
        canCall: { type: Boolean, default: false }
    },

    // Chat-related data
    chatHistory: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],

    // Group-related settings
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

    // Timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);

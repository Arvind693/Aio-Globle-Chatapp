const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Admin' },
    profileImage: {
        type: String,
        default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    },

    // Permissions management for users
    userPermissions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        canMessage: { type: Boolean, default: false },
        canGroupChat: { type: Boolean, default: false },
        canScreenShare: { type: Boolean, default: false },
        canCall: { type: Boolean, default: false }
    }],

    // Auto-response data (only admin can manage)
    autoResponseData: [{
        question: { type: String },
        response: { type: String }
    }],

    // Group chat settings
    groupSettings: {
        canAddUsers: { type: Boolean, default: true },
        canRemoveUsers: { type: Boolean, default: true },
        groupMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Admin', adminSchema);

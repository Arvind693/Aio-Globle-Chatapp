const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const generateToken = require('../config/jwtToken');
const Chat = require('../models/chatModel');
const cloudinary = require('../config/cloudinary');

// User login controller
const loginUser = async (req, res) => {
    const { userName, password,role } = req.body;
    // Validate if userName and password are provided
    if (!userName || !password) {
        return res.status(400).json({
            success: false,
            message: "Please provide both userName and password!"
        });
    }

    try {
        const user = await User.findOne({ userName });

        if (!user) {
            return res.send({ message: "This user is not exist " })
        }

        if(role!==user.role){
            return res.send({message:"You are not a user"})
        }
        if (user) {
            const token = generateToken(user._id);
            res.status(200).json({
                success: true,
                message: "Login successful 🥰",
                data: { user, token }
            });
        } else {
            res.status(201).json({
                success: false,
                message: "Invalid userName or password 😥"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


// Route to search for users
const searchUsers = async (req, res) => {
    const searchQuery = req.query.q;

    if (!searchQuery) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a search query.',
        });
    }

    try {
        // Find users by name or userName (case insensitive)
        const users = await User.find({
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { userName: { $regex: searchQuery, $options: 'i' } }
            ],
            _id: { $ne: req.user._id },  // Exclude the current logged-in user from search results
        });

        res.status(200).json({
            success: true,
            message: 'Users found',
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching for users',
            error: error.message
        });
    }
};


// Route to initiate or create a chat
const createChat = async (req, res) => {
    const { userId, currentUserId } = req.body;

    if (!userId || !currentUserId) {
        return res.status(400).json({
            success: false,
            message: 'Both userId and currentUserId are required.',
        });
    }

    try {
        // Check if a chat already exists between the two users
        let existingChat = await Chat.findOne({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: userId } } },
                { users: { $elemMatch: { $eq: currentUserId } } }
            ]
        }).populate('users', '-password').populate('latestMessage');

        if (existingChat) {
            return res.status(200).json({
                success: true,
                message: 'Chat already exists',
                data: existingChat
            });
        }

        // Create a new one-on-one chat
        const newChat = new Chat({
            chatName: 'sender',
            isGroupChat: false,
            users: [userId, currentUserId],
        });

        const createdChat = await newChat.save();
        const fullChat = await Chat.findOne({ _id: createdChat._id }).populate('users', '-password');

        res.status(201).json({
            success: true,
            message: 'New chat created',
            data: fullChat
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error initiating chat',
            error: error.message
        });
    }
};

// Update the user info

const updateUserProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const profileImage = req.file ? req.file.path : '';

        if (!name) {
            return res.status(400).json({ message: "New user name not found " })
        }

        // Find the user by ID (req.user.id should be set by your authentication middleware)
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If there is an existing profile image, delete it from Cloudinary
        if (user.profileImage) {
            const publicId = user.profileImage.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`aio-globel_profile_image/${publicId}`);
        }

        // Update the user's name and profileImage
        user.name = name || user.name;
        user.profileImage = profileImage || user.profileImage;

        const updatedUser = await user.save();

        res.json({
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                userName: updatedUser.userName,
                profileImage: updatedUser.profileImage,
            },
            message: "User profile updated successfully",
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "An error occurred while updating the profile" });
    }
};

// Fetch user's permissions
const fetchUserPermissions = async (req, res) => {
    const userId = req.params.id; // Extract user ID from request parameters

    try {
        // Find the user by ID and select only the permissions field
        const user = await User.findById(userId).select('permissions');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send the permissions data back to the client
        res.status(200).json({ permissions: user.permissions });
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



module.exports = {
    loginUser,
    searchUsers,
    createChat,
    updateUserProfile,
    fetchUserPermissions
};
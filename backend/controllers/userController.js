const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const generateToken = require('../config/jwtToken');
const Chat = require('../models/chatModel');
const cloudinary = require('../config/cloudinary');


// User registration Routes
const registerUser = async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send({
            success: false,
            message: "Please fill all the fields",
        })
    };

    const existUser = await User.findOne({ email });
    if (existUser) {
        return res.status(400).send({
            success: false,
            message: "User already exist"
        })
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            profileImage: req.file ? req.file.path : ''
        })
        // generate jwt token for user
        const token = generateToken(user._id);

        if (user) {
            res.status(201).send(
                {
                    success: true,
                    message: 'User registered successfully 🥰',
                    data: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        profileImage: user.profileImage
                    },
                    token: token
                }
            );
        }

    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Error adding user",
            error: error.message  // Send a more descriptive error message
        });
    }
};


// User login route
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Validate if email and password are provided
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please provide both email and password!"
        });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.send({ message: "This user is not exist " })
        }

        if (user && await bcrypt.compare(password, user.password)) {
            const token = generateToken(user._id);
            res.status(200).json({
                success: true,
                message: "Login successful 🥰",
                data: { user, token }
            });
        } else {
            res.status(201).json({
                success: false,
                message: "Invalid email or password 😥"
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
        // Find users by name or email (case insensitive)
        const users = await User.find({
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } }
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

        if(!name){
            return res.status(400).json({message:"New user name not found "})
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
                email: updatedUser.email,
                profileImage: updatedUser.profileImage,
            },
            message: "User profile updated successfully",
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "An error occurred while updating the profile" });
    }
};


module.exports = { registerUser, loginUser, searchUsers, createChat, updateUserProfile };
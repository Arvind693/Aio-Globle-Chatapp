const bcrypt = require('bcryptjs');
const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const AutoResponse = require('../models/autoResponsesModel')
const generateToken = require('../config/jwtToken');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

// Register User or Admin
const registerAdmin = async (req, res) => {
    const { name, userName, password } = req.body;

    // Check required fields
    if (!name || !userName || !password) {
        return res.status(400).send({
            success: false,
            message: "Please fill all the fields",
        });
    }

    try {
        // Check if the userName already exists
        const existUser = await User.findOne({ userName });
        if (existUser) {
            return res.status(400).send({
                success: false,
                message: "Admin already exists"
            });
        }
        // Register as Admin with full permissions
        let user = await User.create({
            name,
            userName,
            password,
            role: "Admin",
            userPermissions: [], // To be populated as users register
            autoResponseData: [], // Admin can manage this after creation
            groupSettings: {
                canAddUsers: true,
                canRemoveUsers: true,
                groupMembers: []
            }
        });

        // Generate JWT token for the registered user
        const token = generateToken(user._id);

        // Send response
        res.status(201).send({
            success: true,
            message: `Admin registered successfully 🥰`,
            data: {
                id: user._id,
                name: user.name,
                userName: user.userName,
                role: user.role,
                profileImage: user.profileImage,
                permissions: user.permissions // Admin permissions structure for user
            },
            token: token
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Error registering Admin",
            error: error.message
        });
    }
};

// Admin login controller
const loginAdmin = async (req, res) => {
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
            return res.send({ message: "You are not an Admin " })
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

// register user

const registerUser = async (req, res) => {
    const { name, userName, password, permissions } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ userName });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Set permissions with default values
        const defaultPermissions = {
            canMessage: false,
            canGroupChat: false,
            canScreenShare: false,
            canCall: false,
        };

        // Merge default permissions with provided permissions
        const userPermissions = {
            ...defaultPermissions,
            ...permissions,
        };

        // Create a new user
        const newUser = await User.create({
            name,
            userName,
            password,
            permissions: userPermissions, 
        });

        // Respond with user details and a JWT token
        if (newUser) {
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                userName: newUser.userName,
                role: newUser.role,
                profileImage: newUser.profileImage,
                permissions: newUser.permissions,
                token: generateToken(newUser._id),
            });
        } else {
            res.status(400).json({ error: 'Failed to register user' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};




const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'Admin' } }, {
            password: 1, 
            name: 1, 
            userName: 1,
            role: 1,
            profileImage: 1,
            permissions: 1,
            allowedContacts: 1,
            createdAt: 1
        });

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message
        });
    }
};


const getAllGroups = async (req, res) => {
    try {
        // Fetch all group chats (isGroupChat: true) and populate related fields
        const groups = await Chat.find({ isGroupChat: true,users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password") 
            .populate("latestMessage") 
            .populate("groupAdmin", "-password") 
            .sort({ updatedAt: -1 })
        res.status(200).json({
            success: true,
            message: "Group chats retrieved successfully",
            data: groups
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({
            success: false,
            message: "Error fetching group chats",
            error: error.message
        });
    }
};


// Controller to update permissions for a specific user
const updatePermissions = async (req, res) => {
    const { userId } = req.params;
    const updatedPermissions = req.body;
    console.log(userId);

    try {
        // Update the user's permissions in the database
        const user = await User.findByIdAndUpdate(
            userId,
            { permissions: updatedPermissions },
            { new: true } // Return the updated document
        );

        // Check if the user was found and updated
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Return a success response with the updated user data
        res.status(200).json({
            success: true,
            message: 'Permissions updated successfully',
            data: user,
        });
    } catch (error) {
        console.error('Error updating permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update permissions. Please try again.',
            error: error.message,
        });
    }
};

// Add a user to a group
const addUserToGroup = async (req, res) => {
    const { userId } = req.body; // ID of the user to be added
    const { groupId } = req.params; // ID of the group

    try {
        // Find the group by ID and add the user
        const group = await Chat.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if the user is already in the group
        if (group.users.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already in the group'
            });
        }

        // Add user to the group's users array
        group.users.push(userId);
        await group.save();

        res.status(200).json({
            success: true,
            message: 'User added to group successfully',
            group
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding user to group',
            error: error.message
        });
    }
};

// Remove a user from a group
const removeUserFromGroup = async (req, res) => {
    const { userId } = req.body; // ID of the user to be removed
    const { groupId } = req.params; // ID of the group

    try {
        // Find the group by ID
        const group = await Chat.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if the user is part of the group
        if (!group.users.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User is not in the group'
            });
        }

        // Remove the user from the group's users array
        group.users = group.users.filter(id => id.toString() !== userId);
        await group.save();

        res.status(200).json({
            success: true,
            message: 'User removed from group successfully',
            group
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing user from group',
            error: error.message
        });
    }
};

// Get all auto-responses
const getAutoResponses = async (req, res) => {
    try {
        const autoResponses = await AutoResponse.find();
        res.status(200).json({ autoResponses });
    } catch (error) {
        console.error('Error fetching auto-responses:', error);
        res.status(500).json({ message: 'Failed to fetch auto-responses.' });
    }
};

// Create a new auto-response
const createAutoResponse = async (req, res) => {
    const { trigger, response } = req.body;

    if (!trigger || !response) {
        return res.status(400).json({ message: 'Trigger and response are required.' });
    }

    try {
        const newAutoResponse = new AutoResponse({ trigger, response });
        await newAutoResponse.save();
        res.status(201).json({ message: 'Auto-response added successfully', data: newAutoResponse });
    } catch (error) {
        console.error('Error adding auto-response:', error);
        res.status(500).json({ message: 'Failed to add auto-response.' });
    }
};

// delete auto response
const deleteAutoResponse = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedAutoResponse = await AutoResponse.findByIdAndDelete(id);

        if (!deletedAutoResponse) {
            return res.status(404).json({ message: 'Auto-response not found.' });
        }

        res.status(200).json({ message: 'Auto-response deleted successfully' });
    } catch (error) {
        console.error('Error deleting auto-response:', error);
        res.status(500).json({ message: 'Failed to delete auto-response.' });
    }
};

// Update an existing auto-response
const updateAutoResponse = async (req, res) => {
    const { trigger, response } = req.body;
    const { id } = req.params;

    if (!trigger || !response) {
        return res.status(400).json({ message: 'Trigger and response are required.' });
    }

    try {
        const updatedAutoResponse = await AutoResponse.findByIdAndUpdate(
            id,
            { trigger, response },
            { new: true }
        );

        if (!updatedAutoResponse) {
            return res.status(404).json({ message: 'Auto-response not found.' });
        }

        res.status(200).json({ message: 'Auto-response updated successfully', data: updatedAutoResponse });
    } catch (error) {
        console.error('Error updating auto-response:', error);
        res.status(500).json({ message: 'Failed to update auto-response.' });
    }
};

// search for users
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

// Controller to find a user by ID
const getUserById = async (req, res) => {
    const userId = req.params.id; // Extract user ID from request parameters

    try {
        // Find user by ID and populate allowedContacts with user details
        const user = await User.findById(userId)
            .populate('allowedContacts', 'name userName profileImage')
            .select('-password');

        // Check if user exists
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Send user data as response
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error, please try again later' });
    }
};


const removeAllowedContact = async (req, res) => {
    let { userId, contactId } = req.params;

    try {
        // Convert userId and contactId to ObjectId
        userId = new mongoose.Types.ObjectId(userId);
        contactId = new mongoose.Types.ObjectId(contactId);

        console.log(`Removing contact: ${contactId} from user: ${userId}`);

        // Find the user and update their allowedContacts array
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { allowedContacts: contactId } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Updated allowedContacts:', updatedUser.allowedContacts);

        // Find and delete the chat between the user and the contact if it exists
        const chat = await Chat.findOneAndDelete({
            isGroupChat: false,
            users: { $all: [userId, contactId] }, // Ensure both users are in the chat
        });

        if (chat) {
            console.log(`Deleted chat between user: ${userId} and contact: ${contactId}`);
        } else {
            console.log('No existing chat to delete.');
        }

        res.status(200).json({
            message: 'Contact removed from allowed contacts and chat deleted (if existed)',
            updatedUser,
        });
    } catch (error) {
        console.error('Error removing allowed contact and deleting chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Controller to add a contact to a user's allowedContacts and create a one-on-one chat if not exists
const addAllowedContact = async (req, res) => {
    const { userId } = req.params; // User to update
    const { contactId } = req.body; // Contact to add

    try {
        // Check if both user and contact exist
        const user = await User.findById(userId);
        const contact = await User.findById(contactId);

        if (!user || !contact) {
            return res.status(404).json({ message: 'User or contact not found' });
        }

        // Check if contact is already in allowedContacts
        if (user.allowedContacts.includes(contactId)) {
            return res.status(400).json({ message: 'Contact already allowed' });
        }

        // Add contactId to allowedContacts
        user.allowedContacts.push(contactId);
        await user.save();

        // Check if a one-on-one chat already exists between the two users
        let chat = await Chat.findOne({
            isGroupChat: false,
            users: { $all: [userId, contactId] }, // Matches if both users are in the chat
        })
            .populate('users', '-password')
            .populate('latestMessage');

        if (!chat) {
            // If no chat exists, create a new one
            const newChat = new Chat({
                chatName: 'Private Chat',
                isGroupChat: false,
                users: [userId, contactId],
            });

            chat = await newChat.save();
            chat = await Chat.findOne({ _id: chat._id }).populate('users', '-password');
        }

        res.status(200).json({
            message: 'Contact added and chat created successfully',
            allowedContacts: user.allowedContacts,
            chat,
        });
    } catch (error) {
        console.error('Error adding allowed contact and creating chat:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};


module.exports = {
    registerAdmin,
    loginAdmin,
    getAllUsers,
    registerUser,
    getAllGroups,
    updatePermissions,
    addUserToGroup,
    removeUserFromGroup,
    getAutoResponses,
    createAutoResponse,
    deleteAutoResponse,
    updateAutoResponse,
    searchUsers,
    getUserById,
    removeAllowedContact,
    addAllowedContact,
};
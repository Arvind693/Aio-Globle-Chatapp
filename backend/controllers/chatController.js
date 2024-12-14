const Chat = require('../models/chatModel');
const User = require('../models/userModel')
const Message = require('../models/messageModel');
const cloudinary = require('../config/cloudinary');


// Fetch all chats for a specific user
const fetchAllChats = async (req, res) => {
  const { userId } = req.params;

  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: userId } }
    })
      .populate('users', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Chats retrieved successfully',
      data: chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chats',
      error: error.message
    });
  }
};


// Route for create or one and one chat
const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'UserId parameter is required',
    });
  }

  const currentUserId = req.user._id;

  try {
    // Check if a one-on-one chat exists between the two users
    let chat = await Chat.findOne({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: currentUserId } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', '-password')
      .populate('latestMessage');

    // Populate latest message sender's details
    chat = await User.populate(chat, {
      path: 'latestMessage.sender',
      select: 'name userName',
    });

    if (chat) {
      return res.status(200).json({
        success: true,
        data: chat,
        message: 'Chat found',
      });
    }

    // If no chat exists, create a new one
    const newChat = new Chat({
      chatName: 'sender',
      isGroupChat: false,
      users: [currentUserId, userId],
    });

    const createdChat = await newChat.save();

    const fullChat = await Chat.findOne({ _id: createdChat._id })
      .populate('users', '-password');

    res.status(201).json({
      success: true,
      data: fullChat,
      message: 'New chat created successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating chat',
    });
  }
};

const fetchChats = async (req, res) => {
  try {
    // Find all chats where the current user is a participant
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")  
      .populate("groupAdmin", "-password")  
      .populate("latestMessage")
      .sort({ updatedAt: -1 })  
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name profileImage userName",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: "Error at one-on-one chat" });
  }
};

const initializeAdminChats = async (req, res) => {
  try {
    const adminId = req.user._id; 
    const userRole = req.user.role;
    if(!adminId || !userRole){
      console.log("User Id Not foumd")
    }

    // Only proceed if the user is an admin
    if (userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can initialize chats with all users'
      });
    }

    // Fetch all users except the admin
    const users = await User.find({ _id: { $ne: adminId } });

    for (const user of users) {
      // Check if a chat already exists between admin and the user
      const existingChat = await Chat.findOne({
        users: { $all: [adminId, user._id] }
      });

      if (!existingChat) {
        // If no chat exists, create a new chat with admin and user
        const newChat = new Chat({
          users: [adminId, user._id],
          isGroupChat: false
        });
        await newChat.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Default chats initialized for admin with all users'
    });
  } catch (error) {
    console.log("Chat ctrating failed")
    res.status(500).json({ success: false, message: 'Error initializing chats', error: error.message });
  }
};

const groupChat = async (req, res) => {
  try {
    const { name, users } = req.body;

    if (!name || !users || users.length === 0) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    if (!Array.isArray(users)) {
      return res.status(400).json({ message: "Users should be an array of user IDs." });
    }

    users.push(req.user._id);

    const chat = await Chat.create({
      chatName: name,
      users,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    const fullChat = await Chat.findOne({ _id: chat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: "Failed to create group chat", error });
  }
};


// Controller to handle group renaming
const renameGroup = async (req, res) => {
  const { chatId, newGroupName } = req.body;

  // Check if both chatId and newGroupName are provided
  if (!chatId || !newGroupName) {
    return res.status(400).json({ message: "Please provide both chatId and new group name." });
  }

  try {
    // Find the chat and check if the user is the group admin
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName: newGroupName },
      { new: true } // Return the updated document
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found or you are not the admin." });
    }

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: "Failed to rename the group", error });
  }
};

// controller to add a user to the group chat
const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;  
  if (!chatId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'chatId and userId are required',
    });
  }

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }
    if (chat.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already in the group',
      });
    }
    chat.users.push(userId);

    // Save the updated chat document
    await chat.save();

    // Populate the users and groupAdmin fields for better response structure
    const updatedChat = await Chat.findById(chatId)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json({
      success: true,
      message: 'User added to the group successfully',
      chat: updatedChat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error adding user to the group',
      error: error.message,
    });
  }
};

const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;  

  // Validate the input
  if (!chatId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'chatId and userId are required',
    });
  }

  try {
    // Find the chat by its ID and ensure it's a group chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check if the user is in the group
    if (!chat.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not in the group',
      });
    }

    // Remove the user from the group chat
    chat.users = chat.users.filter(user => user.toString() !== userId);

    // Save the updated chat document
    await chat.save();

    // Populate the users and groupAdmin fields for better response structure
    const updatedChat = await Chat.findById(chatId)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json({
      success: true,
      message: 'User removed from the group successfully',
      chat: updatedChat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error removing user from the group',
      error: error.message,
    });
  }
};

// Controller to delete a group 
const deleteGroup = async (req, res) => { 
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: "Please provide the chatId." });
  }

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Find all messages associated with this group chat
    const messages = await Message.find({ chat: chatId });

    // Delete all associated files from Cloudinary
    for (const message of messages) {
      if (message.file) {
        const publicId = message.file.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`aio-globel_messages_files/${publicId}`);
      }
    }

    // Delete all messages associated with the group
    await Message.deleteMany({ chat: chatId });

    // Delete the group
    await Chat.findByIdAndDelete(chatId);

    res.status(200).json({ message: "Group and its messages deleted successfully." });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Error deleting group", error: error.message });
  }
};

// Controller to delete a chat
const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id; // Get the chat ID from the request parameters

    // Check if chat exists
    const chat = await Chat.findById(chatId);  
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    return res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};




module.exports = {
  fetchAllChats,
  accessChat,
  fetchChats,
  initializeAdminChats,
  groupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  deleteGroup,
  deleteChat
}
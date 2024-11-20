const Message = require('../models/messageModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const { Error } = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Notification = require('../models/noificationModel');

// Get all messages
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name profileImage userName")
      .populate("chat");

    if (!messages) {
      return res.status(404).json({ message: "Messages not found" });
    }

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve messages", error });
  }
};


const sendMessage = async (req, res) => {
  const { chatId, content } = req.body; // Extract content and chatId from the request body
  const uploadedFile = req.file ? req.file.path : null;

  // Validate required fields
  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }

  if (!content && !uploadedFile) {
    return res
      .status(400)
      .json({ message: "Message content or file is required" });
  }

  const newMessage = {
    sender: req.user._id,
    content,
    chat: chatId,
    file: uploadedFile,
  };

  try {
    // Create the new message
    let message = await Message.create(newMessage);

    // Populate the sender field with specific fields
    message = await Message.populate(message, {
      path: "sender",
      select: "name profileImage",
    });

    // Populate the chat field and its users
    message = await Message.populate(message, {
      path: "chat",
      populate: {
        path: "users",
        select: "name profileImage email",
      },
    });

    // Update the latest message in the chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    // Emit the new message to all users in the chat room
    req.io.to(chatId).emit("message received", message);

    /**
     * Notification Logic:
     * Only create a notification if either the sender or the receiver is not present in the same chat room.
     */
    const activeUsers = req.activeUsers; // Use activeUsers passed in middleware
    const senderId = req.user._id.toString();
    const chat = message.chat;
    const chatIdString = chat._id.toString();

    // Check if the sender is active in the chat room
    const isSenderInChatRoom =
      activeUsers[senderId] && activeUsers[senderId] === chatIdString;

    // Iterate through each user in the chat
    for (const user of chat.users) {
      const receiverId = user._id.toString(); 

      // Skip notification for the sender
      if (receiverId === senderId) continue;

      // Check if the receiver is active in the same chat room
      const isReceiverInChatRoom =
        activeUsers[receiverId] && activeUsers[receiverId] === chatIdString;

      /**
       * Create notification only if either sender or receiver is not in the chat room.
       * This prevents notifications when both are already chatting in the same room.
       */
      if (!isSenderInChatRoom || !isReceiverInChatRoom) {
        const notification = {
          sender: senderId,
          receiver: receiverId,
          chat: chatIdString,
          content: message.content || "Sent a file",
        };

        // Create the notification and emit it
        const savedNotification = await Notification.create(notification);
        req.io.to(receiverId).emit("notification received", savedNotification);
      }
    }

    // Send the populated message as the response
    res.json(message);
  } catch (error) {
    console.error("Error in sendMessage:", error);

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(409).json({ message: "Duplicate message detected" });
    }

    // Handle other errors
    res.status(500).json({ message: "Failed to send message", error });
  }
};
 
const deleteMessage = async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user._id; // ID of the authenticated user

  try {
    // Find the message by ID
    const message = await Message.findById(messageId);

    // Check if the message exists
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (message.file) {
      const publicId = message.file.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`aio-globel_messages_files/${publicId}`);
    }

    // Full deletion if the user is the sender
    if (message.sender.equals(userId)) {
      await Message.findByIdAndDelete(messageId);

      // Update the chat to remove this message from the message history
      await Chat.updateOne(
        { _id: message.chat },
        { $pull: { messages: messageId } }
      );

      // Emit to the whole chat room that the message is deleted for everyone
      if (req.io && message.chat) {
        req.io.to(message.chat.toString()).emit('message deleted for everyone', { messageId });
      }

      return res.status(200).json({ message: 'Message deleted for everyone' });
    }
 
    // Local deletion only for the non-sender
    if (req.io) {
      req.io.to(userId.toString()).emit('message deleted locally', { messageId });
    }

    return res.status(200).json({ message: 'Message deleted locally' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Delete multiple messages
const deleteMultipleMessages = async (req, res) => {
  const messageIds = req.body.messageIds; // Expecting an array of message IDs
  const userId = req.user._id; // Get the ID of the authenticated user

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ message: 'Invalid message IDs' });
  }

  try {
    // Find messages that belong to the user (sent by the user)
    const messagesToDelete = await Message.find({
      _id: { $in: messageIds },
      sender: userId, // Only allow deletion of messages sent by the user
    });

    // Delete messages from the database
    if (messagesToDelete.length > 0) {
      await Message.deleteMany({ _id: { $in: messagesToDelete.map((msg) => msg._id) } });

      // Update the chat to remove these messages
      await Chat.updateMany(
        { messages: { $in: messagesToDelete.map((msg) => msg._id) } },
        { $pull: { messages: { $in: messagesToDelete.map((msg) => msg._id) } } }
      );

      // Notify all users in the chat about the deleted messages
      req.io.to(messagesToDelete[0].chat.toString()).emit('multiple messages deleted', { messageIds, isSender: true });
      return res.status(200).json({ message: 'Messages deleted for everyone', deletedCount: messagesToDelete.length });
    }

    // For received messages, delete only locally
    req.io.to(userId.toString()).emit('multiple messages deleted', { messageIds, isSender: false });
    return res.status(200).json({ message: 'Messages deleted locally' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Mark message as delivered
const markAsDelivered = async (req, res) => {
  const { messageId } = req.params;

  try {
    // Find the message by ID and populate chat
    const message = await Message.findByIdAndUpdate(
      messageId,
      { status: "delivered" },
      { new: true }
    ).populate("chat");

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (req.io && message.chat) {
      req.io.to(message.chat._id.toString()).emit("message status update", { messageId, status: "delivered" });
    } else {
      console.error("req.io or message.chat is undefined in markAsDelivered");
    }

    res.status(200).json({ message: "Message marked as delivered", message });
  } catch (error) {
    console.error("Error in markAsDelivered:", error);
    res.status(500).json({ message: "Failed to mark message as delivered", error });
  }
};

// Mark message as seen
const markAsSeen = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  try {
    // Find the message by ID and populate chat
    const message = await Message.findById(messageId).populate("chat");
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!Array.isArray(message.readBy)) {
      message.readBy = [];
    }

    if (!message.readBy.includes(userId.toString())) {
      message.readBy.push(userId.toString());
    }

    const chat = await Chat.findById(message.chat._id).populate("users");
    if (!chat || !Array.isArray(chat.users)) {
      console.error("Chat or chat.users is undefined or not an array in markAsSeen");
      return res.status(500).json({ message: "Chat data is incomplete" });
    }

    const allRead = chat.users.every((user) => message.readBy.includes(user._id.toString()));
    message.status = allRead ? "seen" : "delivered";
    await message.save();

    if (req.io && message.chat) {
      req.io.to(message.chat._id.toString()).emit("message status update", { messageId, status: message.status, userId });
    } else {
      console.error("req.io or message.chat is undefined in markAsSeen");
    }

    res.status(200).json({ message: "Message marked as seen", message });
  } catch (error) {
    console.error("Error in markAsSeen:", error);
    res.status(500).json({ message: "Failed to mark message as seen", error });
  }
};


module.exports = { allMessages, sendMessage, deleteMessage, deleteMultipleMessages, markAsDelivered, markAsSeen };
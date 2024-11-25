const Notification = require('../models/noificationModel');
const Message =require('../models/messageModel');


const fetchNotification = async (req, res) => {
    const userId = req.params.id; 
    try {
      // Fetch notifications for the user
      const notifications = await Notification.find({ receiver: userId })
        .populate('sender', 'name profileImage') 
        .populate('chat', 'chatName') 
        .sort({ createdAt: -1 }); 
  
      res.json({notifications});
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications", error });
    }
  };
  

// Controller to delete all notifications for a specific chat when a receiver clicks on that chat
const deleteNotificationsForChat = async (req, res) => {
    const { chatId } = req.params;
    const receiverId = req.user._id;
  
    try {
      const result = await Notification.deleteMany({
        chat: chatId,
        receiver: receiverId,
      });
  
      if (result.deletedCount > 0) {
        res.status(200).json({ message: "Notifications deleted successfully" });
      }
    } catch (error) {
      console.error("Error deleting notifications:", error);
      res.status(500).json({ message: "Failed to delete notifications" });
    }
  };

  // Controller to delete a single notification
  const deleteNotificationByMessageId = async (req, res) => {
    const messageId = req.params.id;
    try {
      const message = await Message.findById(messageId);
      const chatId = message.chat;
      const deletedNotification = await Notification.findOneAndDelete({ chat: chatId });
      if (!deletedNotification) {
        return res.status(200).json({ message: 'No notification found for this message.' });
      }
      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  };


module.exports = { fetchNotification,deleteNotificationsForChat,deleteNotificationByMessageId };
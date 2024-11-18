const Notification = require('../models/noificationModel');


const fetchNotification = async (req, res) => {
    const userId = req.params.id; // Extract user ID from the authenticated request
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
      // Delete all notifications where chat is chatId and receiver is receiverId
      const result = await Notification.deleteMany({
        chat: chatId,
        receiver: receiverId,
      });
  
      if (result.deletedCount > 0) {
        res.status(200).json({ message: "Notifications deleted successfully" });
      } else {
        res.status(404).json({ message: "No notifications found for this chat" });
      }
    } catch (error) {
      console.error("Error deleting notifications:", error);
      res.status(500).json({ message: "Failed to delete notifications" });
    }
  };


module.exports = { fetchNotification,deleteNotificationsForChat };
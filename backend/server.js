const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const dbConnect = require('./config/dbConnect');
require('dotenv').config();
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoute = require('./routes/messageRoute');
const autoResponseRoute = require('./routes/autoResponseRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const Message = require('./models/messageModel');
const path = require('path');
const User = require('./models/userModel');
const os = require('os');

// Initialize express app
const app = express();

// Middlewares
const REACT_APP_CLIENT_URL = process.env.REACT_APP_CLIENT_URL;

app.use(cors({ origin:REACT_APP_CLIENT_URL, credentials: true }));  
app.use(express.json()); 

// MongoDB connection
dbConnect();

// Socket.io Active Users
const activeUsers = {}; 

// Create an HTTP server and attach socket.io
const server = http.createServer(app);  

// Initialize socket.io with the server   
const io = new Server(server, {
  cors: {
    origin: ['https://aio-globel-chatapp.onrender.com', REACT_APP_CLIENT_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});


// Attach io and activeUsers to Requests
app.use((req, res, next) => {
  req.activeUsers = activeUsers;
  req.io = io;
  next();
});

// Use the router for API routes
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoute);
app.use('/api/auto-responses', autoResponseRoute);




// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/client/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "client", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);


io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  const updateUserOnlineStatus = async (userId, isOnline) => {
    try {
      await User.findByIdAndUpdate(userId, { isOnline });
      console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error(`Error updating user status for ${userId}:`, error);
    }
  };

  socket.on('setup', (userId) => {
    socket.userId = userId;
    socket.join(userId);
    io.emit('update-user-status', { userId, isOnline: true });
    updateUserOnlineStatus(userId, true);
    console.log(`User with ID ${userId} joined their personal room.`);
    socket.emit('connected');
  });

  // Track user's active chat room
  socket.on('join chat', (room) => {
    const userId = socket.userId;
    if (userId) {
      activeUsers[userId] = room;
      socket.join(room);
      console.log(`User with ID ${userId} joined chat room: ${room}`);
    }
  });

  // Handle user leaving a chat
  socket.on('leave chat', (room) => {
    const userId = socket.userId;

    if (userId && activeUsers[userId] === room) {
      delete activeUsers[userId]; // Remove active chat tracking
      socket.leave(room); // Leave the specific chat room
      console.log(`User with ID ${userId} left chat room: ${room}`);
    }
  });

  socket.on('typing', (room) => socket.to(room).emit('typing'));

  socket.on('stop typing', (room) => socket.to(room).emit('stop typing'));

  socket.on('send message', (newMessage) => {
    if (!newMessage || !newMessage.chat || !newMessage.chat._id) {
      console.error('Invalid message format:', newMessage);
      return;
    }
    io.emit('message received', newMessage);
  });

  socket.on('markMessageAsSeen', async ({ chatId, messageId, userId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { seen: true });
      socket.to(chatId).emit('messageSeen', { chatId, messageId });
    } catch (error) {
      console.error('Error marking message as seen:', error);
    }
  });

  // -----------------START SCREEN SHARING LOGIC ----------------------------
  socket.on('request-user-screen', ({ userId }) => {
    console.log(`Admin requesting screen from user: ${userId}`);
    io.to(userId).emit('admin-request-screen');
  });

  socket.on('admin-send-offer', ({ offer, userId }) => {
    console.log(`Admin sending offer to user: ${userId}`);
    io.to(userId).emit('admin-send-offer', { offer });
  });

  socket.on('user-send-answer', ({ answer, adminId }) => {
    console.log(`User sending answer to admin: ${adminId}`);
    io.to(adminId).emit('receive-answer', { answer });
  });
  // ---------------------------END SCREEN SHARE LOGIC-----------------------------
  socket.on("start-video-call", ({ offer, userId, myId, myName }) => {
    io.to(userId).emit("incoming-video-call", { offer, callerId: myId, callerName:myName });
  });

  // Send answer to caller
  socket.on("send-video-answer", ({ answer, callerId }) => {
    io.to(callerId).emit("receive-video-answer", { answer });
  });

  // Exchange ICE candidates
  socket.on("send-ice-candidate", ({ candidate, userId }) => {
    io.to(userId).emit("receive-ice-candidate", { candidate });
  });

  // End video call
  socket.on("end-video-call", ({ userId }) => {
    io.to(userId).emit("call-ended");
  });
  socket.on("call-timeout", ({ userId }) => {
    io.to(userId).emit("call-timed-out", { message: "The caller stopped the call due to timeout." });
  });
  
  socket.on("reject-video-call", ({ callerId }) => {
    io.to(callerId).emit("call-rejected", { callerId, reason: "User is busy" });
  });

  socket.on("call-accepted",({callerId})=>{
    io.to(callerId).emit("call-accepted-by-other-user");
  });


  socket.on('logout', ({ userId }) => {
    io.emit('update-user-status', { userId, isOnline: false });
    updateUserOnlineStatus(userId, false);
  });

  socket.on('disconnect', () => {
    const userId = socket.userId;
    console.log(`User disconnected: ${socket.id}`);
    if (userId) {
      console.log(`User with ID ${userId} disconnected.`);
      io.emit('update-user-status', { userId, isOnline: false });
      updateUserOnlineStatus(userId, false);
    }
  });
});



// Start the server with socket.io

const PORT = process.env.PORT || 5000; 
const SERVER_HOST = process.env.SERVER_HOST;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://${SERVER_HOST}:${PORT}`);
  console.log(`Server is running on http://localhost:${PORT}`);
});
 
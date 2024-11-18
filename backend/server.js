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

// Initialize express app
const app = express();

// Middlewares
app.use(cors());
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
    origin: ['https://aio-globel-chatapp.onrender.com', 'http://localhost:3000'],
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

  socket.on('setup', (userId) => {
    socket.userId = userId;
    socket.join(userId);
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
    const chatRoom = newMessage.chat._id;
    socket.to(chatRoom).emit('message received', newMessage);
  });

  socket.on('markMessageAsSeen', async ({ chatId, messageId, userId }) => {
    try {
      // Mark the message as seen in the database (optional, if you want persistent state)
      await Message.findByIdAndUpdate(messageId, { seen: true });

      // Emit the seen update to all users in the chat room, excluding the sender
      socket.to(chatId).emit('messageSeen', { messageId, userId });
    } catch (error) {
      console.error('Error marking message as seen:', error);
    }
  });
  socket.on("start screen share", ({ userId, stream }) => {
    socket.broadcast.emit("screen sharing started", { userId, stream });
  });

  socket.on("stop screen share", ({ userId }) => {
    socket.broadcast.emit("screen sharing stopped", { userId });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});



// Start the server with socket.io
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

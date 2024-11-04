const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const dbConnect = require('./config/dbConnect');
require('dotenv').config();
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoute = require('./routes/messageRoute');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { markAsDelivered, markAsSeen } = require('./controllers/messageController');
const Message = require('./models/messageModel');
const path = require('path');

// Initialize express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB connection
dbConnect();

// Create an HTTP server and attach socket.io
const server = http.createServer(app);

// Initialize socket.io with the server
const io = new Server(server, {
  cors: {
    origin: ['https://aio-globel-chatapp.onrender.com','http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// Middleware to attach `io` to every request
app.use((req, res, next) => {
  req.io = io; // Attach `io` instance to `req`
  next();
});

// Use the router for API routes
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoute);
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../client/build")));

//   app.get('*', (req, res) => {
//       res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
//   })
// }


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

// Socket.io connection and events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Setup user by joining them to their personal room
  socket.on('setup', (userId) => {
    socket.join(userId);
    console.log(`User with ID ${userId} joined their personal room.`);
    socket.emit('connected');
  });

  // Join specific chat room (group or one-on-one chat)
  socket.on('join chat', (room) => {
    socket.join(room);
    console.log(`User joined chat room: ${room}`);
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
  
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});



// Start the server with socket.io
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

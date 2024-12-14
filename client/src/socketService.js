const SOCKET_ENDPOINT = process.env.NODE_ENV === "production"
    ? "wss://aio-globle-chatapp.onrender.com" 
    : `ws://${serverHost}:5000`;
import { io } from "socket.io-client";

const socket = io(SOCKET_ENDPOINT); 

const initializeSocketListeners = (eventHandlers) => {
  // Register event handlers
  if (eventHandlers.onIncomingVideoCall) {
    socket.on("incoming-video-call", eventHandlers.onIncomingVideoCall);
  }

  if (eventHandlers.onScreenShareStart) {
    socket.on("screen-share-start", eventHandlers.onScreenShareStart);
  }

  if (eventHandlers.onCallEnded) {
    socket.on("call-ended", eventHandlers.onCallEnded);
  }

  if (eventHandlers.onScreenShareEnd) {
    socket.on("screen-share-end", eventHandlers.onScreenShareEnd);
  }
};

const removeSocketListeners = () => {
  socket.off("incoming-video-call");
  socket.off("screen-share-start");
  socket.off("call-ended");
  socket.off("screen-share-end");
};

export { socket, initializeSocketListeners, removeSocketListeners };

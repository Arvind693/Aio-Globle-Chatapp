import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { ChatState } from '../../Context/ChatProvider';
import html2canvas from 'html2canvas';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import EditGroup from '../../Admin/GroupManagement/EditGroup';
import MessageInput from './MessageInput';

const serverHost = process.env.REACT_APP_SERVER_HOST;
const SOCKET_ENDPOINT = process.env.NODE_ENV === "production"
  ? "wss://aio-globle-chatapp.onrender.com" // For secure WebSocket
  : `ws://${serverHost}:5000`;
let socket, selectedChatCompare;
let typingTimeout;

const ChatBox = () => {
  const { selectedChat, user, notification, setNotification } = ChatState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userDetailsModal, setUserDetailsModal] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  const userInfo = user.role === "Admin" ? JSON.parse(localStorage.getItem('adminInfo')) : JSON.parse(localStorage.getItem('userInfo'));
  const chatId = selectedChat ? selectedChat._id : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    if (user) {
      socket = io(SOCKET_ENDPOINT);
      socket.emit("setup", user._id);
      socket.on("connected", () => setSocketConnected(true));
      socket.on("typing", () => setIsTyping(true));
      socket.on("stop typing", () => setIsTyping(false));

      return () => {
        socket.removeAllListeners();
        socket.disconnect();
        clearTimeout(typingTimeout);
      };
    }
  }, [user]);



  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (newMessage) => {
      if (!newMessage || !newMessage.chat || !newMessage.chat._id) {
        console.error("Invalid message format received:", newMessage);
        return;
      }

      const incomingChatId = newMessage.chat._id;

      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        if (!messages[incomingChatId]?.length && selectedChat?._id !== incomingChatId) {
          console.log("Message ignored because messages state is empty or chat is not selected.");
          return updatedMessages; // Return the current state unchanged
        }

        if (updatedMessages[incomingChatId]) {
          if (!updatedMessages[incomingChatId].some((msg) => msg._id === newMessage._id)) {
            updatedMessages[incomingChatId].push(newMessage);
          }
        } else {
          updatedMessages[incomingChatId] = [newMessage];
        }

        return updatedMessages;
      });

      if (selectedChat?._id === incomingChatId) {
        scrollToBottom(); // Scroll only if the incoming message belongs to the selected chat
      }
    };

    // Handle "message deleted for everyone"
    const handleDeletedForEveryone = ({ messageId, chatId }) => {
      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        if (updatedMessages[chatId]) {
          updatedMessages[chatId] = updatedMessages[chatId].filter((msg) => msg._id !== messageId);
        }
        return updatedMessages;
      });

      setNotification((prevNotifications) =>
        prevNotifications.filter((n) => n.messageId !== messageId && n.chat !== chatId)
      );
    };

    socket.on("message received", handleMessageReceived);
    socket.on("message deleted for everyone", handleDeletedForEveryone);

    return () => {
      socket.off("message received", handleMessageReceived);
      socket.off("message deleted for everyone", handleDeletedForEveryone);
    };
  }, [selectedChat, socket, messages]);

  // Automatically mark messages as seen when the user views the chat
  useEffect(() => {
    if (!selectedChat || !socketConnected) return;

    const chatId = selectedChat._id;

    if (messages[chatId]) {
      messages[chatId].forEach((message) => {
        if (!message.seen && message.sender._id !== user._id) {
          socket.emit("markMessageAsSeen", {
            chatId,
            messageId: message._id,
            userId: user._id,
          });
        }
      });
    }
  }, [selectedChat, socketConnected, messages, user._id]);


  useEffect(() => {
    const handleSeenEvent = ({ chatId, messageId }) => {
      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };

        if (updatedMessages[chatId]) {
          updatedMessages[chatId] = updatedMessages[chatId].map((msg) =>
            msg._id === messageId ? { ...msg, seen: true } : msg
          );
        }

        return updatedMessages;
      });
    };

    socket.on('messageSeen', handleSeenEvent);
  }, [socket, setMessages, selectedChat, setNotification]);


  useEffect(() => {
    selectedChatCompare = selectedChat;
    setNewMessage('');
  }, [selectedChat]);
  // ...........................Fetch Messages....................
  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/message/${chatId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setMessages((prev) => {
        const updatedMessages = { ...prev, [chatId]: data };
        return updatedMessages;
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (!chatId) return;

    if (!messages[chatId]) {
      console.log("Updated Messages State")
      // Fetch only if messages for the chat are not already loaded
      fetchMessages(chatId);
    }
    socket.emit("join chat", chatId);

    return () => {
      socket.emit("leave chat", chatId);
    };
  }, [chatId, selectedChat]);



  const handleScreenshot = async () => {
    if (chatRef.current) {
      try {
        const canvas = await html2canvas(chatRef.current);
        const screenshot = canvas.toDataURL('image/png');
        console.log('Screenshot taken:', screenshot);

        // Save the screenshot to the chat log (sending to backend for persistence)
        await axios.post('/api/chat/save-screenshot', { chatId, screenshot }, {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        console.log("Screenshot saved to chat logs");
      } catch (error) {
        console.error("Error capturing screenshot:", error);
      }
    }
  };

  const handleTyping = () => {
    socket.emit("typing", chatId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", chatId);
    }, 1000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() && !selectedFile) return;
    const tempId = Date.now();
    const tempMessage = {
      _id: tempId,
      content: newMessage,
      file: selectedFile ? URL.createObjectURL(selectedFile) : null,
      sender: { _id: user._id },
      isTemporary: true,
      createdAt: new Date().toISOString(),
      sending: true,
    };
    setMessages((prevMessages) => {
      const updatedMessages = { ...prevMessages };
      if (updatedMessages[chatId]) {
        updatedMessages[chatId] = [...updatedMessages[chatId], tempMessage];
      } else {
        updatedMessages[chatId] = [tempMessage];
      }

      return updatedMessages;
    });

    const formData = new FormData();
    formData.append("chatId", chatId);
    if (newMessage.trim()) {
      formData.append("content", newMessage);
    }
    if (selectedFile) {
      formData.append("file", selectedFile);
    }


    setNewMessage('');
    setSelectedFile(null);

    try {
      const { data } = await axios.post(`/api/message`, formData, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });

      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        if (updatedMessages[chatId]) {
          updatedMessages[chatId] = updatedMessages[chatId].filter((msg) => msg._id !== tempId);
        }
        return updatedMessages;
      });

      socket.emit("send message", data);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== tempId)
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage(e);
    } else {
      handleTyping();
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`/api/message/notification/${messageId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setNotification((prevNotifications) =>
        prevNotifications.filter((n) => n.chat._id !== selectedChat._id)
      );
      await axios.delete(`/api/message/${messageId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      socket.emit("message deleted", { messageId, chatId, isSender: true });
      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        if (updatedMessages[chatId]) {
          updatedMessages[chatId] = updatedMessages[chatId].filter((msg) => msg._id !== messageId);
        }
        return updatedMessages;
      });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const truncateFileName = (fileName) => {
    const words = fileName.split(/[\s-_]+/);
    if (words.length > 3) {
      return `${words.slice(0, 3).join(' ')}...`;
    }
    return fileName;
  };
  const handleLeaveChat = () => {
    if (chatId && socketConnected) {
      socket.emit('leave chat', chatId);
    }
  };
  useEffect(() => {
    return () => {
      handleLeaveChat();
      socket.removeAllListeners();
      clearTimeout(typingTimeout);
    };
  }, [selectedChat]);

  const handleEmojiClick = (emojiObject) => {
    setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  return (
    <div className="h-full w-full bg-gradient-to-r from-gray-100 to-gray-300 flex flex-col">
      {selectedChat && (
        <>
          <ChatHeader
            socket={socket}
            handleScreenshot={handleScreenshot}
            setUserDetailsModal={setUserDetailsModal}
          />
          <MessageList
            messages={messages}
            isTyping={isTyping}
            hoveredMessage={hoveredMessage}
            setHoveredMessage={setHoveredMessage}
            handleDeleteMessage={handleDeleteMessage}
            loading={loading}
          />
          <MessageInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleKeyDown={handleKeyDown}
            sendMessage={sendMessage}
            setSelectedFile={setSelectedFile}
          />
        </>
      )}

      <div>
        {userDetailsModal && (
          <EditGroup onClose={() => setUserDetailsModal(!userDetailsModal)} />
        )}
      </div>
    </div>
  );
};

export default ChatBox;

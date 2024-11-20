import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { ChatState } from '../../Context/ChatProvider';
import { IoIosSend } from "react-icons/io";
import html2canvas from 'html2canvas';
import { MdAttachFile } from "react-icons/md";
import ImageModal from '../Animations/ImageModal';
import UserDetails from '../UserDetails/UserDetails';
import ScreenShare from '../../Admin/ScreenShare/ScreenShare';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';

const ENDPOINT = process.env.NODE_ENV === 'production' ? 'https://aio-globle-chatapp.onrender.com' : 'http://localhost:5000';
let socket , selectedChatCompare;
let typingTimeout;

const ChatBox = () => { 
  const { selectedChat, setSelectedChat, user, notification, setNotification } = ChatState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userDetailsModal, setUserDetailsModal] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScreenShareOpen, setIsScreenShareOpen] = useState(false)

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null); // Reference for the chat area

  const userInfo = user.role === "Admin" ? JSON.parse(localStorage.getItem('adminInfo')) : JSON.parse(localStorage.getItem('userInfo'));
  const chatId = selectedChat ? selectedChat._id : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    if (user) {
      if (!socket) {
        socket = io(ENDPOINT);
        socket.emit("setup", user._id);
        socket.on("connected", () => {
          setSocketConnected(true);
        });
        socket.on("typing", () => setIsTyping(true));
        socket.on("stop typing", () => setIsTyping(false));
      }
     
      socket.on("message deleted for everyone", ({ messageId }) => {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
      });
      socket.on("message deleted locally", ({ messageId }) => {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
      });
      socket.on("message received", (newMessage) => {
        if (!selectedChatCompare || selectedChatCompare._id !== newMessage.chat._id) {
          return
        } else {
          setMessages((prevMessages) => {
            // Prevent adding duplicate messages
            if (prevMessages.find((msg) => msg._id === newMessage._id)) {
              return prevMessages;
            }
            return [...prevMessages, newMessage];
          });
          scrollToBottom();
        }
      });
      socket.on("notification received", (savedNotification) => {

        setNotification((prevNotifications) => {
          const isDuplicate = prevNotifications.some(
            (notif) => notif._id === savedNotification._id
          );
          if (!isDuplicate) {
            return [...prevNotifications, savedNotification];
          }
          return prevNotifications;
        });
      });
      return () => {
        socket.removeAllListeners();
        clearTimeout(typingTimeout);
      };
    }
  }, [user,socketConnected]);

  useEffect(() => {
    if (!selectedChat || !socketConnected) return;
    messages.forEach((message) => {
      if (!message.seen && message.sender._id !== user._id) {
        socket.emit('markMessageAsSeen', { chatId, messageId: message._id, userId: user._id });
      }
    });
  }, [selectedChat, messages, socketConnected]);

  useEffect(() => {
    socket.on('messageSeen', ({ messageId, userId }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, seen: true } : msg
        )
      );
      setNotification((prevNotifications) =>
        prevNotifications.filter((msg) => msg._id !== messageId)
      );
    });

    return () => {
      socket.off('messageSeen');
    };
  }, []);

  useEffect(() => {
    selectedChatCompare = selectedChat;
    setNewMessage('');
  }, [selectedChat]);

  useEffect(() => {
    if (!chatId) return;

    handleLeaveChat();

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/message/${chatId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        }); 
        setMessages(data);
        setLoading(false);
        scrollToBottom();
        socket.emit("join chat", chatId);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
    return () => {
      handleLeaveChat();
      clearTimeout(typingTimeoutRef.current);
      socket.removeAllListeners(); // Clean up socket listeners
    };
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat, messages]);

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
    setMessages((prevMessages) => [...prevMessages, tempMessage]);

    const formData = new FormData();
    formData.append("chatId", chatId);
    if (newMessage.trim()) {
      formData.append("content", newMessage); // Add content if available
    }
    if (selectedFile) {
      formData.append("file", selectedFile); // Add file if selected
    }


    setNewMessage('');
    setSelectedFile(null);

    try {
      const { data } = await axios.post(`/api/message`, formData, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`, // Do NOT set Content-Type manually
        },
      });

      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== tempId)
      );

      socket.emit("send message", data); // Emit the message to the socket
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
      await axios.delete(`/api/message/${messageId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      await axios.delete(`/api/message/notification/${messageId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });

      setNotification((prevNotifications) =>
        prevNotifications.filter((n) => n.chat._id !== selectedChat._id)
      );
      socket.emit("message deleted", { messageId, chatId, isSender: true });
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const getProfileImage = () => {
    if (selectedChat.isGroupChat) {
      return selectedChat.groupImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
    }
    const otherUser = selectedChat.users.find((u) => u._id !== user._id);
    return otherUser.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
  };

  const getChatName = () => {
    return selectedChat.isGroupChat
      ? selectedChat.chatName
      : selectedChat.users.find((u) => u._id !== user._id)?.name || 'Chat';
  };

  const truncateFileName = (fileName) => {
    const words = fileName.split(/[\s-_]+/); // Split by spaces, dashes, or underscores
    if (words.length > 3) {
      return `${words.slice(0, 3).join(' ')}...`;
    }
    return fileName;
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };
  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };
  const handleScreenShare = () => {
    setIsScreenShareOpen(!isScreenShareOpen);
  }
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

  return (
    <div className="chatBoxMainContainer bg-gradient-to-r from-gray-100 to-gray-300 flex flex-col h-full w-full">
      {selectedChat && (
        <>
          <ChatHeader
            selectedChat={selectedChat}
            handleScreenShare={handleScreenShare}
            handleScreenshot={handleScreenshot}
            isScreenShareOpen={isScreenShareOpen}
            getProfileImage={getProfileImage}
            getChatName={getChatName}
            setUserDetailsModal={setUserDetailsModal}
          />
          <MessageList
            messages={messages}
            user={user}
            isTyping={isTyping}
            hoveredMessage={hoveredMessage}
            setHoveredMessage={setHoveredMessage}
            handleDeleteMessage={handleDeleteMessage}
            handleImageClick={handleImageClick}
            loading={loading}
          />
        </>
      )}

      <div>
        <form
          onSubmit={sendMessage}
          className="p-4 max-md:p-4 bg-transparent flex justify-center max-md:mb-6"
        >
          <div className="h-14 max-md:h-10 flex items-center w-full max-w-sm md:w-1/2 shadow-lg max-md:mb-6 bg-gray-700 rounded-l-lg">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="text-white flex-1 p-2 md:p-3 bg-transparent focus:outline-none shadow-inner text-sm md:text-base"
            />
            <label htmlFor="file-upload" className="cursor-pointer bg-transparent text-gray-400 p-2">
              <MdAttachFile size={25} />
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </div>
          <button
            type="submit"
            className="h-14 max-md:h-10 bg-green-600 max-md:text-l text-white px-3 max-md:p-2 rounded-r-lg hover:bg-green-800 shadow-lg"
          >
            <IoIosSend size={30} />
          </button>
          {selectedFile && (
            <div className="fixed bottom-20 text-sm text-gray-500 mt-2">
              <span className="font-semibold text-gray-700">Selected File:</span> {truncateFileName(selectedFile.name)}
            </div>
          )}
        </form>
        {isImageModalOpen && <ImageModal imageUrl={selectedImage} onClose={closeImageModal} />}
        {userDetailsModal && (
          <UserDetails onClose={() => setUserDetailsModal(!userDetailsModal)} />
        )}
        <ScreenShare
          socket={socket}
          isScreenShareOpen={isScreenShareOpen}
          setIsScreenShareOpen={setIsScreenShareOpen}
        />
      </div>
    </div>
  );
};

export default ChatBox;

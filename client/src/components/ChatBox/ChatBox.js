import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { ChatState } from '../../Context/ChatProvider';
import { IoIosSend } from "react-icons/io";
import { FaTrash } from 'react-icons/fa';
import ChatTypingLoader from '../ChatTypingLoader/ChatTypingLoader';
import html2canvas from 'html2canvas'; // Import html2canvas
import { MdCameraAlt } from 'react-icons/md'; // Icon for the screenshot button
import { MdAttachFile } from "react-icons/md";
import SendingMessageAnimation from '../Animations/SendingMessageAnimation';
import ImageModal from '../Animations/ImageModal';
import UserDetails from '../UserDetails/UserDetails';
import ScreenShare from '../../Admin/ScreenShare/ScreenShare';
import { FaCrown } from "react-icons/fa";

const ENDPOINT = process.env.NODE_ENV === 'production' ? 'https://aio-globle-chatapp.onrender.com' : 'http://localhost:5000';
let socket = io(ENDPOINT), selectedChatCompare;
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScreenShareOpen, setIsScreenShareOpen] = useState(false)

  const messagesEndRef = useRef(null);
  const chatRef = useRef(null); // Reference for the chat area

  const userInfo = user.role === "Admin" ? JSON.parse(localStorage.getItem('adminInfo')) : JSON.parse(localStorage.getItem('userInfo'));
  const chatId = selectedChat ? selectedChat._id : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    if (user) {
      socket.emit("setup", user._id);
      socket.removeAllListeners();
      socket.on("connected", () => setSocketConnected(true));
      socket.on("typing", () => setIsTyping(true));
      socket.on("stop typing", () => setIsTyping(false));
      socket.on("message deleted for everyone", ({ messageId }) => {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
      });
      socket.on("message deleted locally", ({ messageId }) => {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
      });
      socket.on("message received", (newMessage) => {
        if (!selectedChatCompare || selectedChatCompare._id !== newMessage.chat._id) {
          setNotification((prevNotifications) => [
            ...prevNotifications,
            newMessage,
          ]);
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

      return () => {
        socket.removeAllListeners();
        clearTimeout(typingTimeout);
      };
    }
  }, [user]);

  useEffect(() => {
    if (!selectedChat || !socketConnected) return;

    // Emit `markMessageAsSeen` for each unseen message
    messages.forEach((message) => {
      if (!message.seen && message.sender._id !== user._id) {
        socket.emit('markMessageAsSeen', { chatId, messageId: message._id, userId: user._id });
      }
    });
  }, [selectedChat, messages, socketConnected]);

  useEffect(() => {
    socket.on('messageSeen', ({ messageId, userId }) => {
      // Update the message's "seen" status in the state
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
  }, [selectedChat]);

  useEffect(() => {
    if (!chatId) return;
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
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat, messages]);

  const handleScreenshot = async () => {
    if (chatRef.current) {
      try {
        const canvas = await html2canvas(chatRef.current); // Capture the chat area
        const screenshot = canvas.toDataURL('image/png'); // Convert to image
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
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stop typing", chatId);
    }, 1000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() && !selectedFile) return;
    // Generate a temporary ID for the message
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

    // Add the temporary message to the messages state
    setMessages((prevMessages) => [...prevMessages, tempMessage]);

    const formData = new FormData();
    formData.append("chatId", chatId); // Ensure chatId is added
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

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
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

  return (
    <div className="chatBoxMainContainer bg-gradient-to-r from-gray-100 to-gray-300 flex flex-col h-full w-full">
      {selectedChat && (
        <div className="bg-transparent text-white p-4 max-md:p-2 flex items-center justify-between space-x-3  md:space-x-4">
          <div className='flex justify-center items-center gap-1'>
            <div className="h-10 w-10 max-md:h-6 max-md:w-6 rounded-full overflow-hidden cursor-pointer" onClick={() => setUserDetailsModal(true)}>
              <img src={getProfileImage()} alt="Profile" className="h-full w-full object-cover" />
            </div>
            <h3 className="text-lg max-md:text-10px text-black font-semibold truncate">{getChatName()}</h3>
          </div>
          <button
            onClick={handleScreenShare}
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
          >
            {isScreenShareOpen ? "Stop Screen Share" : "Screen Share"}
          </button>
          <button
            onClick={handleScreenshot}
            className="bg-gray-500 text-white p-2 rounded-md ml-4 flex items-center gap-1 hover:bg-gray-600"
          >
            <MdCameraAlt size={20} />Screenshot
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-transparent h-full mb-2 md:mb-5 pb-10">
        {loading ? (
          <p>Loading.....</p>
        ) : (
          messages.map((msg, index) => {
            const isNewDay = index === 0 || formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);

            return (
              <div key={msg._id || msg.tempId}>
                {isNewDay && (
                  <div className="text-center my-1 md:my-2 text-gray-500 text-xs md:text-sm">
                    {formatDate(msg.createdAt)}
                  </div>
                )}
                <div className={`mb-2 md:mb-4 flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
                  <div
                    onMouseEnter={() => setHoveredMessage(msg._id)}
                    onMouseLeave={() => setHoveredMessage(null)}
                    className={`relative max-w-[80%] md:max-w-xs p-2 rounded-lg shadow-md ${msg.sender._id === user._id ? msg.content ? 'bg-green-600 text-white' : 'bg:transparent border-2 border-green-500' : msg.content ? 'bg-gray-400 text-black' : 'bg-transparent border-2 border-gray-400'}`}
                  >
                    {msg.content && (
                      <p className="break-words text-sm max-md:text-12px">{msg.content}</p>
                    )}
                    {msg.file && (
                      <div className="mt-2">
                        {msg.file.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                          // Render image
                          <img
                            src={msg.file}
                            alt="Sent file"
                            onClick={() => handleImageClick(msg.file)}
                            className="max-w-full max-h-40 rounded-lg cursor-pointer"
                          />
                        ) : (
                          // Render other files as a downloadable link
                          <a
                            href={msg.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 font-semibold underline text-sm"
                          >
                            View File
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center gap-1 mt-1">
                      <p className="text-xs max-md:text-8px text-gray-700">{formatTime(msg.createdAt)}</p>
                      {msg.sender._id === user._id && (
                        <div className="flex items-center gap-1">
                          <p className='max-md:text-8px'>
                            {msg.isTemporary ? (
                              <span className="text-yellow-600 font-semibol text-sm max-md:text-8px"><SendingMessageAnimation /></span>
                            ) : msg.seen ? (
                              <span className="text-gray-700 text-xs max-md:text-8px">Seen</span>
                            ) : (
                              <span className="text-sm max-md:text-8px text-gray-700">Sent</span>
                            )}
                          </p>
                          {hoveredMessage === msg._id && (
                            <FaTrash
                              className="absolute top-0 right-0 text-red-800 cursor-pointer"
                              onClick={() => handleDeleteMessage(msg._id)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isTyping && <p>{<ChatTypingLoader />}</p>}
        <div ref={messagesEndRef} />
      </div>

      <div>
        <form
          onSubmit={sendMessage}
          className="p-4 max-md:p-4 bg-transparent flex justify-center max-md:mb-6 "
        >
          <div className="h-14 flex items-center w-full max-w-sm md:w-1/2 shadow-lg max-md:mb-6 bg-gray-700 rounded-l-lg ">
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
            className="bg-green-600 max-md:text-l text-white px-3 max-md:p-2 rounded-r-lg hover:bg-green-800 shadow-lg"
          >
            <IoIosSend size={30} />
          </button>
          {selectedFile && (
            <div className="fixed bottom-20 text-sm text-gray-500 mt-2">
              <span className='font-semibold text-gray-700'>Selected File:</span> {truncateFileName(selectedFile.name)}
            </div>
          )}
        </form>
        {isImageModalOpen && (<ImageModal imageUrl={selectedImage} onClose={closeImageModal} />)}
        {userDetailsModal && (<UserDetails onClose={() => setUserDetailsModal(!userDetailsModal)} />)}
        {/* {isScreenShareOpen && (<ScreenShare admin={true} userId="672b3d3abdfe103e6159b7fe" />)} */}
        <ScreenShare
          socket={socket}
          isScreenShareOpen={isScreenShareOpen}
          setIsScreenShareOpen={setIsScreenShareOpen}
        />;

      </div>
    </div>
  );
};

export default ChatBox;

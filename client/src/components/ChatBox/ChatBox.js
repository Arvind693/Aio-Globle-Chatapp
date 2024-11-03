import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { ChatState } from '../../Context/ChatProvider';
import './ChatBox.css';
import { IoIosSend } from "react-icons/io";
import { FaTrash } from 'react-icons/fa';
import UserDetails from '../UserDetails/UserDetails';
import ChatTypingLoader from '../ChatTypingLoader/ChatTypingLoader';

const ENDPOINT = "http://localhost:5000";
let socket = io(ENDPOINT), selectedChatCompare;
let typingTimeout;

const ChatBox = () => {
  const { selectedChat, user, notification, setNotification } = ChatState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const chatId = selectedChat ? selectedChat._id : null;

  const scrollToBottom = () => {
    const chatContainer = messagesEndRef.current?.parentNode;
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
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
          setMessages((prevMessages) => [
            ...prevMessages.filter((msg) => msg._id !== newMessage._id), // Remove any duplicate
            newMessage,
          ]);
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
        const { data } = await axios.get(`http://localhost:5000/api/message/${chatId}`, {
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
  }, [selectedChat, messages])

  const handleTyping = () => {
    socket.emit("typing", chatId);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stop typing", chatId);
    }, 1000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      tempId,
      content: newMessage,
      chat: selectedChat,
      sender: { _id: user._id, name: user.name },
      createdAt: new Date(),
    };

    // setMessages((prevMessages) => [...prevMessages, tempMessage]);
    scrollToBottom();

    setNewMessage('');

    try {
      const { data } = await axios.post(`http://localhost:5000/api/message`, {
        content: newMessage,
        chatId,
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        }
      });

      // setMessages((prevMessages) =>
      //   prevMessages
      //     .filter((msg) => msg.tempId !== tempId)
      //     .concat({ ...data, status: 'sent' })
      // );
      socket.emit("send message", data);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
        )
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
      await axios.delete(`http://localhost:5000/api/message/${messageId}`, {
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

  return (
    <div className="chatBoxMainContainer bg-gradient-to-r from-gray-100 to-gray-300 flex flex-col h-full w-full">
      {selectedChat && (
        <div className="bg-transparent text-white p-4 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full overflow-hidden cursor-pointer" onClick={() => setModalOpen(true)}>
            <img src={getProfileImage()} alt="Profile" className="h-full w-full object-cover" />
          </div>
          <h3 className="text-lg text-black font-semibold">{getChatName()}</h3>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 bg-transparent h-full mb-5 pb-10">
        {loading ? (
          <p>Loading.....</p>
        ) : (
          messages.map((msg, index) => {
            const isNewDay = index === 0 || formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);

            return (
              <div key={msg._id || msg.tempId}>
                {isNewDay && (
                  <div className="text-center my-2 text-gray-500 text-sm">
                    {formatDate(msg.createdAt)}
                  </div>
                )}
                <div className={`mb-4 flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
                  <div
                    onMouseEnter={() => setHoveredMessage(msg._id)}
                    onMouseLeave={() => setHoveredMessage(null)}
                    className={`relative  max-w-xs p-2 rounded-lg shadow-md ${msg.sender._id === user._id ? 'bg-green-600 text-white' : 'bg-gray-400 text-black'}`}>
                    <p className='break-words'>{msg.content}</p>
                    <div className='flex justify-between gap-1 items-center'>
                      <p className="text-xs text-gray-300 mt-1">{formatTime(msg.createdAt)}</p>
                      {msg.sender._id === user._id && (
                        <div>
                          <p>{msg.seen ? <span className='text-xs'>Seen</span> : <span className='text-xs text-gray-300'>Sent</span>}</p>
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
        <form onSubmit={sendMessage} className="p-4 bg-transparent flex justify-center mb-6">
          <div className="flex items-center w-1/2 shadow-lg">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 p-2 rounded-l-lg border-2 border-green-600 focus:outline-none shadow-inner"
            />
            <button
              type="submit"
              className="bg-green-600 text-2xl border-2 border-green-600 text-white p-2 rounded-r-lg hover:bg-green-800 shadow-lg">
              <IoIosSend size={24} />
            </button>
          </div>
        </form>
      </div>
      {modalOpen && (
        <UserDetails user={selectedChat.users.find((u) => u._id !== user._id)} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
};

export default ChatBox;

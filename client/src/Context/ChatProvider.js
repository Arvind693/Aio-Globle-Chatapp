import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import io from "socket.io-client";

const ChatContext = createContext();

const ENDPOINT = process.env.NODE_ENV === 'production' ? 'https://aio-globle-chatapp.onrender.com' : 'http://localhost:5000';
let socket;

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserFromLocalStorage = () => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));

      if (adminInfo) {
        setUser(adminInfo.user);
        if (location.pathname === '/' || location.pathname === '/admin-login-signup') {
          navigate('/admin_dashboard');  
        }
      } else if (userInfo) {
        setUser(userInfo.user);
        if (location.pathname === '/' || location.pathname === '/user-login-signup') {
          navigate('/user/user-dashboard');
        }
      } else if (location.pathname === '/admin_dashboard') {
        navigate('/admin_login');  
      }
    };

    fetchUserFromLocalStorage();
  }, [location, navigate]);  
  

  // Logout function
  const logout = () => {
    if (socket) {
      socket.emit('logout', { userId: user?._id });
      socket.disconnect(); 
    }
    localStorage.removeItem('userInfo');
    setChats([]);
    setUser(null); 
    setSelectedChat(null);
  };

  const adminLogout = () => {
    if (socket) {
      socket.emit('logout', { userId: user?._id }); 
      socket.disconnect(); 
    }
    localStorage.removeItem('adminInfo');
    setChats([]);
    setUser(null); 
    setSelectedChat(null);
  };

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        notification,
        setNotification,
        chats,
        setChats,
        adminLogout,
        logout  
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;

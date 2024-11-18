import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Initialize user as null
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
        if (location.pathname === '/') {
          navigate('/admin_dashboard');  
        }
      } else if (userInfo) {
        setUser(userInfo.user);
      } else if (location.pathname === '/admin_dashboard') {
        navigate('/admin_login');  
      }
    };

    fetchUserFromLocalStorage();
  }, [location, navigate]); 

  // Logout function
  const logout = () => {
    localStorage.removeItem('userInfo');
    setChats([]);
    setUser(null); 
    setSelectedChat(null);
    navigate('/'); 
  };

  const adminLogout = () => {
    localStorage.removeItem('adminInfo');
    setChats([]);
    setUser(null); 
    setSelectedChat(null);
    navigate('/admin_login'); 
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

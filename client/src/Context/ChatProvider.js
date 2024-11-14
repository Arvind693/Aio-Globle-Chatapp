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
          navigate('/admin_dashboard');  // Redirect to dashboard if on root path
        }
      } else if (userInfo) {
        setUser(userInfo.user);
      } else if (location.pathname === '/admin_dashboard') {
        // Redirect to login if trying to access the dashboard without adminInfo
        navigate('/admin_login');  
      }
    };

    fetchUserFromLocalStorage();
  }, [location, navigate]); // Depend on location to track route changes

  // Logout function
  const logout = () => {
    localStorage.removeItem('userInfo');
    setChats([]);
    setUser(null); 
    setSelectedChat(null);
    navigate('/');  // Redirect to home/login page after logout
  };

  const adminLogout = () => {
    localStorage.removeItem('adminInfo');
    setChats([]);
    setUser(null); 
    setSelectedChat(null);
    navigate('/admin_login');  // Redirect to admin login page after logout
  };

  const userLogout = () => {
    localStorage.removeItem('userInfo');
    setChats([]);
    setUser(null); 
    setSelectedChat(null);
    navigate('/');  // Redirect to home/login page after logout
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
        logout  // Expose the logout function
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

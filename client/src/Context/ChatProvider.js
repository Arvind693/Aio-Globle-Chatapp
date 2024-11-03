import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);  // Initialize user as null
  const [selectedChat, setSelectedChat] = useState(null);
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUserFromLocalStorage = () => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));

      if (userInfo) {
        setUser(userInfo.user);
      } else {
        navigate('/');  // Redirect to home/login page if no user info
      }
    };

    fetchUserFromLocalStorage();
  }, [navigate]);

  // Logout function
  const logout = () => {
    localStorage.removeItem('userInfo');
    setChats('');
    setUser(null); 
    setSelectedChat('');
    navigate('/');  // Redirect to home/login page after logout
  };

  // Prevent the "Loading..." screen after logging out by checking for userInfo in localStorage
  useEffect(() => {
    if (!localStorage.getItem('userInfo')) {
      setUser(null);  // Make sure user is null if no userInfo is found
      navigate('/');  // Ensure redirection to the home page
    }
  }, [navigate]);

  // Avoid showing Loading... screen after logout
  if (user === null && localStorage.getItem('userInfo')) {
    return <div>Loading...</div>; // Show loader only when user is expected to be fetched
  }

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

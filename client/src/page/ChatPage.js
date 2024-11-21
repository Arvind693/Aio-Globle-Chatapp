import React, { useState,useEffect, } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Navbar/UsersSidebar/UsersSideBar';
import ChatBox from '../components/ChatBox/ChatBox';
import WelcomePage from '../components/WelcomePage/WelcomePage'; // Import WelcomePage
import './ChatPage.css';
import { ChatState } from '../Context/ChatProvider';
import AdminNavbar from '../Admin/AdminNavbar/AdminNavbar';
import io from 'socket.io-client';

const ENDPOINT = process.env.NODE_ENV === 'production' ? 'https://aio-globle-chatapp.onrender.com' : 'http://localhost:5000';
let socket;

const ChatPage = () => {
  const { user, selectedChat } = ChatState();

  useEffect(() => {
    if (user && user._id) {
      if (!socket) {
        socket = io(ENDPOINT);
        socket.emit("setup", user._id);
        return () => {
          socket.disconnect();
          socket = null; 
        };
      }
    }
  }, [user]);
  
  return (
    <div className='w-full'>
      {user ? (
        <div className="chatPageMainContainer">
          <div>
            {user.role==="Admin" ?<div className="relative z-50"><AdminNavbar /></div>: <Navbar />}
          </div>
          <div className="sidebarAndChatboxContainer flex">
            <Sidebar />
            {/* Conditionally render WelcomePage or ChatBox */}
            {selectedChat ? (
              <ChatBox />
            ) : (
              <WelcomePage />
            )}
          </div>
        </div>
      ) : (
        <div> Loading...</div>
      )}
    </div>
  );
};

export default ChatPage;

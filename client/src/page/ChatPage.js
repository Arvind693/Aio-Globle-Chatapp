import React, { useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Navbar/UsersSidebar/UsersSideBar';
import ChatBox from '../components/ChatBox/ChatBox';
import WelcomePage from '../components/WelcomePage/WelcomePage'; // Import WelcomePage
import './ChatPage.css';
import { ChatState } from '../Context/ChatProvider';
import AdminNavbar from '../Admin/AdminNavbar/AdminNavbar';

const ChatPage = () => {
  const { user, selectedChat } = ChatState();
  
  return (
    <div>
      {user ? (
        <div className="chatPageMainContainer">
          <div>
            {user.role==="Admin" ?<AdminNavbar/>: <Navbar />}
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
        <div>Loading...</div>
      )}
    </div>
  );
};

export default ChatPage;

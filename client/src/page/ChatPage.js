import React, { useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Navbar/UsersSidebar/UsersSideBar';
import ChatBox from '../components/ChatBox/ChatBox';
import WelcomePage from '../components/WelcomePage/WelcomePage'; // Import WelcomePage
import './ChatPage.css';
import { ChatState } from '../Context/ChatProvider';

const ChatPage = () => {
  const { user, selectedChat } = ChatState(); // Assuming selectedChat comes from ChatState

  return (
    <div>
      {user ? (
        <div className="chatPageMainContainer">
          <div>
            <Navbar />
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

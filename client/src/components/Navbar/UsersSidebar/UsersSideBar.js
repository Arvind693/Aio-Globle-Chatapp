import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UsersSideBar.css';
import { ChatState } from '../../../Context/ChatProvider';

const Sidebar = () => {
  const [loggedUser, setLoggedUser] = useState();
  const { selectedChat, setSelectedChat, chats, setChats, user } = ChatState(); // Access user from context

  const userInfo = JSON.parse(localStorage.getItem('userInfo')); // Get user info from localStorage

  // Fetch the chats from the API
  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          authorization: `Bearer ${userInfo?.token}`, // Ensure correct token format
        },
      };
      const { data } = await axios.get('/api/chat', config);
      setChats(data); // Set the chats after fetching
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };
  
  // On component mount, set the logged-in user and fetch chats
  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    setLoggedUser(storedUserInfo?.user); // Safely access the user object
    fetchChats();
  }, [selectedChat, chats]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const getProfileImage = (chat) => {
    if (chat?.isGroupChat) {
      return chat?.groupImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
    }
    const otherUser = chat?.users?.find((u) => u._id !== loggedUser?._id);
    return otherUser?.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
  };

  const isSelectedChat = (chat) => {
    return selectedChat?._id === chat?._id;
  };

  return (
    <div className="sidebarMainContainer w-1/4 h-full bg-gray-200 p-4 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-black">MY Chats</h2>
      </div>

      {/* Chat List (Scrollable Area) */}
      <div className="bg-transparent flex-1 overflow-y-auto mt-4">
        {chats.length > 0 ? (
          chats.map((chat, index) => (
            <div
              key={index}
              className={`p-4 cursor-pointer flex items-center space-x-3 rounded-lg 
                ${isSelectedChat(chat) ? 'bg-green-500' : 'hover:bg-gray-300'} transition duration-200`}
              onClick={() => handleChatSelect(chat)} // Handle chat selection
            >
              {/* Profile Image with Conditional Styles for Groups and Users */}
              <div className="relative">
                <div
                  className={`h-10 w-10 rounded-full border-4 
                  ${isSelectedChat(chat) ? 'border-blue-500' : 'border-green-400'}
                  overflow-hidden flex items-center justify-center`}
                >
                  {chat?.isGroupChat ? (
                    <div className="h-full w-full bg-blue-200 flex items-center justify-center rounded-full">
                      <span className="text-lg font-bold text-blue-800 uppercase">
                        {chat?.chatName?.charAt(0)}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={getProfileImage(chat)}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Chat Name */}
              <span className="text-black text-lg font-semibold">
                {chat?.isGroupChat
                  ? chat?.chatName
                  : chat?.users?.filter((user) => user._id !== loggedUser?._id)[0]?.name || 'Unknown'}
              </span>
            </div>
          ))
        ) : (
          <div className="p-4">No chats found</div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

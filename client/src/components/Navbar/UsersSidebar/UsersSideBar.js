import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UsersSideBar.css';
import { ChatState } from '../../../Context/ChatProvider';
import { FaCrown } from "react-icons/fa";

const Sidebar = () => {
  const [loggedUser, setLoggedUser] = useState(null);
  const { selectedChat, setSelectedChat, chats, setChats, user, notification, setNotification } = ChatState();
  const [loading, setLoading] = useState(true);

  // Determine the user role and retrieve appropriate user info
  const userInfo = user?.role === 'Admin'
    ? JSON.parse(localStorage.getItem('adminInfo'))
    : JSON.parse(localStorage.getItem('userInfo'));

  // Fetch the chats from the API
  const fetchChats = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          authorization: `Bearer ${userInfo?.token}`,
        },
      };
      const { data } = await axios.get('/api/chat', config);
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUserInfo = user?.role === 'Admin'
      ? JSON.parse(localStorage.getItem('adminInfo'))
      : JSON.parse(localStorage.getItem('userInfo'));
    setLoggedUser(storedUserInfo?.user);
    fetchChats();
  }, []);

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    try {
      const config = {
        headers: {
          authorization: `Bearer ${userInfo?.token}`,
        },
      };

      await axios.delete(`/api/message/delete-notification/${chat._id}`, config);

      // Optionally, update the notification state if you want to remove it locally
      setNotification((prevNotifications) =>
        prevNotifications.filter((n) => n.chat._id !== chat._id)
      );
    } catch (error) {
      console.error("Error deleting notifications:", error);
    }
  };

  const getProfileImage = (chat) => {
    if (chat?.isGroupChat) {
      return chat?.groupImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
    }
    const otherUser = chat?.users?.find((u) => u._id !== loggedUser?._id);
    return otherUser?.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
  };

  const isAdminUser = (chat) => {
    const otherUser = chat?.users?.find((u) => u._id !== loggedUser?._id);
    return otherUser?.role === 'Admin';
  };

  const isSelectedChat = (chat) => selectedChat?._id === chat?._id;

  // Function to get the notification count for a specific chat
  const getNotificationCount = (chat) => {
    // Filter notifications where the sender is one of the chat users (excluding the logged-in user)
    const otherUserIds = chat.users
      .filter((u) => u._id !== loggedUser?._id)
      .map((u) => u._id);

    // Count notifications where the sender is in the list of chat users
    const count = notification.filter((n) => otherUserIds.includes(n.sender._id)).length;
    return count;
  };

  return (
    <div className="sidebarMainContainer w-1/4 h-full bg-gray-200 p-4 text-white flex flex-col max-md:p-2">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 max-md:p-0">
        <h2 className="text-lg font-semibold text-black max-md:text-10px">MY Chats</h2>
      </div>

      {loading ? (
        <div className='w-1/3'>
          <div className='w-full h-9 bg-gray-300 mt-4 '></div>
          <div className='w-full h-9 bg-gray-300 mt-4 '></div>
          <div className='w-full h-9 bg-gray-300 mt-4 '></div>
          <div className='w-full h-9 bg-gray-300 mt-4 '></div>
          <div className='w-full h-9 bg-gray-300 mt-4 '></div>
        </div>
      ) : (
        <div className="bg-transparent flex-1 overflow-y-auto scrollbar-hide mt-4 max-md:mt-2">
          {chats.length > 0 ? (
            chats.map((chat, index) => (
              <div
                key={index}
                className={`p-4 max-md:p-1 mt-2 cursor-pointer flex max-md:flex-col items-center max-md:gap-0 rounded-lg 
                    ${isSelectedChat(chat) ? 'bg-green-500' : 'bg-gray-300'} transition duration-200`}
                onClick={() => handleChatSelect(chat)}
              >
                {/* Notification Badge */}
                {getNotificationCount(chat) > 0 && !chat?.isGroupChat && (
                  <span className="relative top-0 right-1  bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {getNotificationCount(chat)}
                  </span>
                )}

                {/* Profile Image */} 
                <div className="relative">
                  <div
                    className={`h-10 w-10 max-md:w-6 max-md:h-6 max-md:border-2 rounded-full border-4 
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
                  {chat?.isGroupChat ? null : isAdminUser(chat) && (
                    <span className="absolute bottom-10 right-0 max-md:bottom-3 max-md:left-0 bg-yellow-500 max-md:bg-transparent max-md:text-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      <FaCrown className='max-md:text-xs max-md:bg-transparent' />
                    </span>
                  )}
                </div>

                {/* Chat Name */}
                <p className="text-black text-lg font-semibold max-md:text-6px max-md:leading-none ml-4">
                  {chat?.isGroupChat
                    ? chat?.chatName
                    : chat?.users?.filter((u) => u._id !== loggedUser?._id)[0]?.name || 'Unknown'}
                </p>
              </div>
            ))
          ) : (
            <div className="p-4 text-black">No chats found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UsersSideBar.css';
import { ChatState } from '../../../Context/ChatProvider';
import { FaCrown, FaCircle } from "react-icons/fa";
import io from 'socket.io-client';

const serverHost = process.env.REACT_APP_SERVER_HOST;

const SOCKET_ENDPOINT = process.env.NODE_ENV === "production"
    ? "wss://aio-globle-chatapp.onrender.com"
    : `ws://${serverHost}:5000`;
let socket;

const Sidebar = () => {
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loggedUser, setLoggedUser] = useState(null);
  const { selectedChat, setSelectedChat, chats, setChats, user, notification, setNotification,getConfig } = ChatState();
  const [loading, setLoading] = useState(true);
  
  const [notificationCounts, setNotificationCounts] = useState(() => {
    const storedCounts = localStorage.getItem("notificationCounts");
    return storedCounts ? JSON.parse(storedCounts) : {};
  });

  const userInfo = React.useMemo(() => {
    return user?.role === 'Admin'
      ? JSON.parse(localStorage.getItem('adminInfo'))
      : JSON.parse(localStorage.getItem('userInfo'));
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      socket = io(SOCKET_ENDPOINT);
      socket.on('update-user-status', ({ userId, isOnline }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [userId]: { isOnline },
        }));
      });

      return () => {
        socket.off('update-user-status');
      };
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users',getConfig());
      setOnlineUsers(
        response.data.data.reduce((acc, user) => {
          acc[user._id] = { isOnline: user.isOnline };
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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
      setNotification((prevNotifications) =>
        prevNotifications.filter((n) => n.chat !== chat._id)
      );

      // Remove notifications for the selected chat
      setNotificationCounts((prev) => {
        const updatedCounts = { ...prev };
        delete updatedCounts[chat._id];
        localStorage.setItem("notificationCounts", JSON.stringify(updatedCounts));
        return updatedCounts;
      });
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

  useEffect(() => {
    if(!notification){
      return;
    }
    const counts = notification.reduce((acc, notif) => {
      acc[notif.chat] = (acc[notif.chat] || 0) + 1;
      return acc;
    }, {}); 
    setNotificationCounts(counts);
    localStorage.setItem("notificationCounts", JSON.stringify(counts));
  }, [notification]);

  const isUserOnline = (userId) => onlineUsers[userId]?.isOnline;
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
                    ${isSelectedChat(chat) ? 'bg-gray-400' : 'bg-gray-300'} transition duration-200`}
                onClick={() => handleChatSelect(chat)}
              >
                {/* Notification Badge */}
                {notificationCounts[chat._id] > 0 && (
                  <span className="relative top-0 right-1  bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {notificationCounts[chat._id]}
                  </span>
                )}
                {/* Profile Image */}
                <div className="relative">
                  <div
                    className={`h-10 w-10 max-md:w-6 max-md:h-6 max-md:border-2 rounded-full border-2 
                      ${isSelectedChat(chat) ? 'border-blue-600' : 'border-blue-400'}
                      ${!chat?.isGroupChat && isUserOnline(
                      chat?.users?.find((u) => u._id !== loggedUser?._id)?._id
                    )
                        ? 'border-green-500 animate-borderPulse'
                        : ''} 
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

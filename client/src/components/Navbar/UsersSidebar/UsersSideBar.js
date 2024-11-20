import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UsersSideBar.css';
import { ChatState } from '../../../Context/ChatProvider';
import { FaCrown, FaCircle } from "react-icons/fa";
import io from 'socket.io-client';

const ENDPOINT = process.env.NODE_ENV === 'production' ? 'https://aio-globle-chatapp.onrender.com' : 'http://localhost:5000';
let socket;

const Sidebar = () => {
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loggedUser, setLoggedUser] = useState(null);
  const { selectedChat, setSelectedChat, chats, setChats, user,
    notification,
    setNotification,
  } = ChatState();
  const [loading, setLoading] = useState(true);


  const userInfo = React.useMemo(() => {
    return user?.role === 'Admin'
      ? JSON.parse(localStorage.getItem('adminInfo'))
      : JSON.parse(localStorage.getItem('userInfo'));
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      socket = io(ENDPOINT);
      // socket.emit("setup", user._id);
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

  // Fetch notifications for the user
  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`/api/message/fetch-notification/${user?._id}`);
      setNotification((prevNotifications) => {
        const newNotifications = data.notifications.filter(
          (newNotification) =>
            !prevNotifications.some((prevNotification) => prevNotification._id === newNotification._id)
        );
        return [...prevNotifications, ...newNotifications];
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error.message);
    }
  };

  // Effect to fetch notifications on mount
  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
    }
  }, [user?._id, notification]);

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

  const getNotificationCount = (chat) => {

    return notification.filter((n) => n.chat._id === chat._id).length;
  };

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
                {getNotificationCount(chat) > 0 && (
                  <span className="relative top-0 right-1  bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {getNotificationCount(chat)}
                  </span>
                )}

                {/* Online/Offline Status */}
                {!chat?.isGroupChat && (
                  <FaCircle
                    className={`mr-2 text-sm ${isUserOnline(
                      chat?.users?.find((u) => u._id !== loggedUser?._id)?._id
                    )
                      ? 'text-green-500'
                      : 'text-red-500'
                      }`}
                  />
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

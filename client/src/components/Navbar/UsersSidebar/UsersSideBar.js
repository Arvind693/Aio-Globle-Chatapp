import React, { useEffect, useState } from 'react'; 
import axios from 'axios';
import './UsersSideBar.css';
import { ChatState } from '../../../Context/ChatProvider';
import { FaCrown } from "react-icons/fa";

const Sidebar = () => {
  const [loggedUser, setLoggedUser] = useState(null);
  const { selectedChat, setSelectedChat, chats, setChats, user } = ChatState();
  const [loading, setLoading] = useState(true); // Initialize with `true` for initial load

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
          authorization: `Bearer ${userInfo?.token}`, // Ensure correct token format
        },
      };
      const { data } = await axios.get('/api/chat', config);
      setChats(data); // Set the chats after fetching
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false); // Stop loading after the request completes
    }
  };

  useEffect(() => {
    const storedUserInfo = user?.role === 'Admin'
      ? JSON.parse(localStorage.getItem('adminInfo'))
      : JSON.parse(localStorage.getItem('userInfo'));
    setLoggedUser(storedUserInfo?.user);
    fetchChats();
  }, []); // Fetch chats only once on component mount

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

  const isAdminUser = (chat) => {
    const otherUser = chat?.users?.find((u) => u._id !== loggedUser?._id);
    return otherUser?.role === 'Admin';
  };

  const isSelectedChat = (chat) => selectedChat?._id === chat?._id;

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
                {/* Profile Image with Conditional Styles for Groups and Users */}
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
                    <span className="absolute bottom-10 right-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      <FaCrown />
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

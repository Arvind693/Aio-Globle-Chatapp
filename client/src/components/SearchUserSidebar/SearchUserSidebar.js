import React, { useEffect, useState } from 'react';
import { CiSearch } from "react-icons/ci";
import { FaWindowClose } from "react-icons/fa";
import { ChatState } from '../../Context/ChatProvider';

const SearchUserSidebar = ({ toggleUserSearch }) => {
  const { setSelectedChat, chats, user} = ChatState();
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    if (!search) {
      setFilteredUsers([]);
      return;
    }

    const searchUsers = () => {
      const usersSet = new Set(); 
      chats.forEach((chat) => {
        chat.users.forEach((u) => {
          if (
            u._id !== user._id &&
            (u.name.toLowerCase().includes(search.toLowerCase()) ||
              u.userName.toLowerCase().includes(search.toLowerCase()))
          ) {
            usersSet.add(JSON.stringify(u)); 
          }
        });
      });
      setFilteredUsers(Array.from(usersSet).map((u) => JSON.parse(u)));
    };

    searchUsers();
  }, [search, chats, user]);

  const accessChat = async (userId) => {
    try {
      const chat = chats.find((c) => c.users.some((u) => u._id === userId) && !c.isGroupChat);
      if (!chat) {
        console.error('Chat not found');
        return;
      }
      setSelectedChat(chat);
      toggleUserSearch();
    } catch (error) {
      console.error('Error accessing chat:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex  justify-center bg-gray-800 bg-opacity-75 transition-opacity duration-300">
      <div className="bg-gray-900 w-full max-w-lg rounded-lg shadow-lg p-6 m-4 animate-slideInUp overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-green-600 max-md:text-12px">Search Users by Name and Username</h2>
          <button onClick={toggleUserSearch} className="text-2xl max-md:text-lg text-green-600 hover:text-red-400">
            <FaWindowClose />
          </button>
        </div>

        <div className="mt-4 flex items-center">
          <input
            type="text"
            placeholder="Search by name or userName"
            className="text-green-600 flex-grow p-2 border-2 border-green-600 rounded-l-lg focus:outline-none focus:text-green-600 max-md:text-12px"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
          <button disabled className="p-2 bg-green-600 border-2 border-green-600 text-2xl text-white rounded-r-lg max-md:text-lg">
            <CiSearch />
          </button>
        </div>

        {/* Search user display */}
        <div className="mt-4 space-y-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center p-3 max-md:p-1 bg-gray-100 rounded-lg max-md:rounded hover:bg-gray-200 cursor-pointer"
                onClick={() => accessChat(user._id)}
              >
                <div className="w-12 h-12 max-md:w-6 max-md:h-6 rounded-full overflow-hidden bg-gray-300 mr-3">
                  <img
                    src={user.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-gray-800 font-medium max-md:text-12px">{user.name}</p>
                  <p className="text-gray-500 text-sm max-md:text-8px">{user.userName}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchUserSidebar;

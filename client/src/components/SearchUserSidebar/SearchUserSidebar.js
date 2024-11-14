import React, { useEffect, useState } from 'react';
import { CiSearch } from "react-icons/ci";
import { FaWindowClose } from "react-icons/fa";
import axios from 'axios';
import { ChatState } from '../../Context/ChatProvider';

const SearchUserSidebar = ({ toggleUserSearch }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setSelectedChat, chats, setChats } = ChatState();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!search) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get(`/api/user/search?q=${search}`, config);
        setUsers(data.data);
      } catch (err) {
        setError('Failed to fetch users. Please try again later.');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [search, userInfo.token]);

  const accessChat = async (userId) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(`/api/chat`, { userId }, config);
      const chat = data.data;

      if (!chats.find((c) => c._id === chat._id)) {
        setChats([chat, ...chats]);
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
          
          <h2 className="text-2xl font-bold text-green-600 max-md:text-12px">Connect With Your Colleague</h2>
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
          {loading && <p className="text-center text-gray-600">Loading...</p>}
          {error && <p className="text-center text-red-600">{error}</p>}
          {!loading && !error && users.length > 0 ? (
            users.map((user, index) => (
              <div
                key={index}
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
            !loading && !error && <p className="text-center text-gray-500">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchUserSidebar;

import React, { useEffect, useState } from 'react';
import { ChatState } from '../../Context/ChatProvider';
import { FaWindowClose } from "react-icons/fa";
import { GrUpdate } from "react-icons/gr";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { message } from 'antd';
import axios from 'axios';
import './Userdetails.css';

const UserDetails = ({ onClose }) => {
    const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();
    const [newGroupName, setNewGroupName] = useState('');
    const [toggleInput, setToggleInput] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toggleAddUser, setToggleAddUser] = useState(false);
    const [error, setError] = useState('');

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        fetchUsers();
    }, [searchTerm, userInfo.token]);

    // Ensure selectedChat and user are not undefined
    if (!selectedChat || !user) {
        return null; // Handle case where selectedChat or user is missing
    }

    // Search user functionality
    const fetchUsers = async () => {
        if (!searchTerm) {
            setSearchResults([]); // Clear the search results when input is empty
            return;
        }
        setLoading(true);
        setError(''); // Clear previous errors
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get(`/api/user/search?q=${searchTerm}`, config);

            setSearchResults(data.data); // Update with search results
            setLoading(false);
        } catch (err) {
            setLoading(false);
            setError('Failed to fetch users. Please try again later.');
            console.error('Error fetching users:', err);
        }
    };

    // Ensure selectedChat.groupAdmin exists before trying to access _id
    const isAdmin = selectedChat.isGroupChat && selectedChat.groupAdmin && selectedChat.groupAdmin._id === user._id;

    const chatDetails = selectedChat.isGroupChat
        ? {
            name: selectedChat.chatName,
            members: selectedChat.users, // We no longer filter groupAdmin out here
            type: 'Group',
            additionalInfo: selectedChat.groupDescription || 'No additional information'
        }
        : {
            name: selectedChat.users.find((u) => u._id !== user._id)?.name,
            email: selectedChat.users.find((u) => u._id !== user._id)?.email,
            profileImage: selectedChat.users.find((u) => u._id !== user._id)?.profileImage || '/default-profile.png',
            additionalInfo: selectedChat.users.find((u) => u._id !== user._id)?.status || 'No status available',
            type: 'Individual'
        };

    // Rename Group Functionality
    const handleRename = async () => {
        if (!newGroupName) {
            message.warning('Please enter a new group name', 2);
            return;
        }
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo?.token}`,
                },
            };
            const body = { chatId: selectedChat._id, newGroupName };

            await axios.put(`/api/chat/rename-group`, body, config);
            setSelectedChat((prevChat) => ({
                ...prevChat,
                chatName: newGroupName,
            }));

            message.success('Group name updated successfully', 2);
            setToggleInput(false);
        } catch (error) {
            message.error('Failed to update group name', 2);
        }
    };

    // Remove User from Group Functionality
    const handleRemoveUser = async (userId) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo?.token}`,
                },
            };

            const response = await axios.put(
                `/api/chat/group/remove`,
                { userId, chatId: selectedChat._id },
                config
            );

            message.success(response.data.message, 2);
            const updatedUsers = selectedChat.users.filter((user) => user._id !== userId);
            setSelectedChat((prevChat) => ({ ...prevChat, users: updatedUsers }));
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to remove user', 2);
        }
    };

    // Delete Chat Functionality
    const handleDeleteChat = async () => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo?.token}`,
                },
            };

          const response = await axios.delete(`/api/chat/${selectedChat._id}`, config);
            message.success(response.data.message, 2);
            onClose(); // Close the modal
            setChats(chats.filter(chat => chat._id !== selectedChat._id)); // Remove chat from state
            setSelectedChat(null); // Clear selected chat
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to delete the chat', 2);
        }
    };

    // Delete Group Functionality
    const handleDeleteGroup = async () => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo?.token}`,
                },
            };

            const response = await axios.delete(`/api/chat/group`, {
                data: { chatId: selectedChat._id },
                ...config
            });
            message.success(response.data.message, 2);
            onClose();
            setChats(chats.filter(chat => chat._id !== selectedChat._id));
            setSelectedChat(null);
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to delete the group', 2);
        }
    };

    // Add New User to Group Functionality
    const handleAddUser = async (userId) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo?.token}`,
                },
            };

            const response = await axios.put(
                `/api/chat/group/add`,
                { userId, chatId: selectedChat._id },
                config
            );

            const updatedChat = response.data.chat;

            setSelectedChat(updatedChat);
            message.success(`${response.data.message}`, 2);
        } catch (error) {
            message.error('Failed to add user to the group', 2);
        }
    };

    return (
        <div className="modal-container">
            <div className="modal-content w-1/2 bg-white p-6 rounded-lg shadow-lg relative">
                <button onClick={onClose} className="text-2xl absolute top-2 right-2 text-gray-500"><FaWindowClose /></button>
                <div className="flex flex-col gap-2 items-center space-x-4 mb-4">
                    <img
                        src={chatDetails.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
                        alt="Profile"
                        className="h-16 w-16 rounded-full object-cover shadow-lg shadow-gray-700"
                    />
                    <div className='flex flex-col gap-1 items-center justify-center'>
                        <h2 className="text-lg text-green-600 font-semibold">{chatDetails.name}</h2>
                        <h2 className="text-lg text-green-600 font-semibold">{chatDetails.email}</h2>

                        {isAdmin && (
                            <p className='text-2xl' onClick={() => setToggleInput(!toggleInput)}>{<MdDriveFileRenameOutline />}</p>
                        )}
                    </div>
                    {toggleInput && (
                        <div>
                            <input type="text" placeholder='New Group Name' onChange={(e) => setNewGroupName(e.target.value)} />
                            <button onClick={handleRename}>{<GrUpdate />}</button>
                        </div>
                    )}
                </div>

                {chatDetails.type === 'Group' && (
                    <div>
                        <p className="mb-2 text-xl text-yellow-600 font-semibold">Group Members:</p>
                        <ul className='h-40 bg-gray-500 rounded mb-2 grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1 justify-center overflow-y-auto p-4'>
                            {selectedChat.users.map((member) => (
                                <div key={member._id} className="mb-1 flex gap-3 items-center justify-between bg-green-600 rounded-md p-2 overflow-visible">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={member.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
                                            alt="Profile"
                                            className="h-8 w-8 rounded-full object-cover shadow-lg shadow-gray-700"
                                        />
                                        <p className='text-white whitespace-normal'>{member.name}</p>
                                        {selectedChat.groupAdmin._id === member._id && (
                                            <span className="relative top-0 right-0 left-5 bottom-7 text-xs text-white bg-black p-1 rounded ml-2">Admin</span>
                                        )}
                                    </div>
                                    {isAdmin && member._id !== user._id && (
                                        <button
                                            onClick={() => handleRemoveUser(member._id)}
                                            className="text-2xl text-red-600 hover:text-red-700"
                                        >
                                            <FaWindowClose />
                                        </button>
                                    )}
                                </div>

                            ))}
                        </ul>
                        {/* Add new user to the group*/}
                        <div>
                            <button
                                className='bg-gray-600 px-2 py-2 rounded text-white'
                                onClick={() => setToggleAddUser(!toggleAddUser)}>
                                {toggleAddUser ? 'Close' : 'Add User'}
                            </button>
                        </div>
                        {isAdmin && toggleAddUser && (
                            <div className="mt-4 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Search user by name or email"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="p-2 rounded-md border w-full"
                                />

                                {/* Show search results */}
                                {loading ? (
                                    <div className="text-center">Loading...</div>
                                ) : (searchTerm &&
                                    <div className="searchedUserContainer bg-gray-500 max-h-40 overflow-y-auto mb-4">
                                        {searchResults.map((user) => (
                                            <div
                                                key={user._id}
                                                onClick={() => handleAddUser(user._id)}
                                                className="searchedResults flex items-center"
                                            >
                                                <div className="profileImage"></div>
                                                <div className="flex gap-1">
                                                    <img
                                                        className='h-8 w-8 rounded-full object-cover shadow-lg shadow-gray-700'
                                                        src={user.profileImage} alt="" />
                                                    <p className='text-white'>{user.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Group delete button */}
                        {
                            isAdmin && (
                                <div className='mt-4'>
                                    <button
                                        onClick={handleDeleteGroup}
                                        className='bg-red-400 p-2 rounded text-white font-medium'>
                                        Delete Group
                                    </button>
                                </div>
                            )
                        }
                    </div>
                )}

                {/* Individual chat delete button */}
                {chatDetails.type === 'Individual' && (
                    <div className='mt-4'>
                        <button
                            onClick={handleDeleteChat}
                            className='bg-red-400 p-2 rounded text-white font-medium'>
                            Delete Chat
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetails;

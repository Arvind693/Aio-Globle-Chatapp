import React, { useEffect, useState } from 'react';
import { ChatState } from '../../Context/ChatProvider';
import { FaWindowClose } from "react-icons/fa";
import { GrUpdate } from "react-icons/gr";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { RiDeleteBin5Fill } from "react-icons/ri";
import { message, Spin, Modal} from 'antd';
import axios from 'axios';
import { FaCrown } from "react-icons/fa";

const EditGroup = ({groups,setGroups, onClose }) => {
    const { selectedChat, setSelectedChat, user, chats, setChats,getConfig } = ChatState();
    const [newGroupName, setNewGroupName] = useState('');
    const [toggleInput, setToggleInput] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toggleAddUser, setToggleAddUser] = useState(false);
    const [error, setError] = useState('');

   const adminInfo = user.role==="Admin" ? JSON.parse(localStorage.getItem('adminInfo')) : JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        fetchUsers();
    }, [searchTerm]);

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
            const { data } = await axios.get(`/api/user/search?q=${searchTerm}`, getConfig());

            setSearchResults(data.data); // Update with search results
            setLoading(false);
        } catch (err) {
            setLoading(false);
            setError('Failed to fetch users. Please try again later.');
            console.error('Error fetching users:', err);
        }
    };

    // Ensure selectedChat.groupAdmin exists before trying to access _id
    const isAdmin = selectedChat.isGroupChat && selectedChat.groupAdmin && selectedChat.groupAdmin._id === adminInfo.user._id;
    const chatDetails = selectedChat.isGroupChat
        ? {
            name: selectedChat.chatName,
            members: selectedChat.users,
            type: 'Group',
            additionalInfo: selectedChat.groupDescription || 'No additional information'
        }
        : {
            name: selectedChat.users.find((u) => u._id !== user._id)?.name,
            userName: selectedChat.users.find((u) => u._id !== user._id)?.userName,
            password:selectedChat.users.find((u) => u._id !== user._id)?.password,
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
            const body = { chatId: selectedChat._id, newGroupName };

            await axios.put(`/api/chat/rename-group`, body, getConfig());
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
            const response = await axios.put(
                `/api/chat/group/remove`,
                { userId, chatId: selectedChat._id },
                getConfig()
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
                    Authorization: `Bearer ${adminInfo?.token}`,
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
            const response = await axios.delete(`/api/chat/group`, {
                data: { chatId: selectedChat._id },
                ...getConfig()
            });
            message.success(response.data.message, 2);
            onClose();
            setChats(chats.filter(chat => chat._id !== selectedChat._id));
            setSelectedChat(null);
            if(groups){
                setGroups(groups.filter((group) => group._id !== selectedChat._id)); 
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to delete the group', 2);
        }
    };

    // Add New User to Group Functionality
    const handleAddUser = async (userId) => {
        try {
            const response = await axios.put(
                `/api/chat/group/add`,
                { userId, chatId: selectedChat._id },
                getConfig()
            );

            const updatedChat = response.data.chat;

            setSelectedChat(updatedChat);
            message.success(`${response.data.message}`, 2);
        } catch (error) {
            message.error('Failed to add user to the group', 2);
        }
    };

    const confirmRemoveGroup = (userId) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this Group?',
            content: 'This action cannot be undone.',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: () => handleDeleteGroup(),
        });
    };

    return (
        <div className="fixed inset-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content w-1/2 max-md:w-auto bg-white p-6 rounded-lg shadow-lg relative">
                <button onClick={onClose} className="text-2xl max-md:text-lg absolute top-2 right-2 text-gray-500"><FaWindowClose /></button>
                <div className="flex flex-col gap-2 items-center space-x-4 mb-4">
                    <img
                        src={chatDetails.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
                        alt="Profile"
                        className="h-60 w-60 max-md:h-48 max-md:w-48 rounded-full object-cover shadow shadow-gray-700"
                    />
                    <div className='flex flex-col gap-1 items-center justify-center'>
                        <h2 className="text-lg max-md:text-12px text-gray-600 font-semibold">{chatDetails.name}</h2>
                        {chatDetails.type==='Individual' &&(
                            <div>
                            <p className="max-md:text-12px text-gray-600 font-semibold">Username: <span className='text-blue-500'>{chatDetails.userName}</span></p>
                            </div>
                        )}

                        {isAdmin && (
                            <p className='text-2xl cursor-pointer' onClick={() => setToggleInput(!toggleInput)}>{<MdDriveFileRenameOutline />}</p>
                        )}
                    </div>
                    {toggleInput && (
                        <div className="flex items-center gap-1  sm:p-4 w-full max-w-sm sm:max-w-md mx-auto">
                            <input
                                type="text"
                                placeholder="New Group Name"
                                onChange={(e) => setNewGroupName(e.target.value)}
                                className="w-full px-3 py-1 max-md:px-1 max-md:py-0 text-sm max-md:text-10px border-2 border-green-500 rounded outline-none
                                            transition duration-200"
                            />
                            <button
                                onClick={handleRename}
                                className="p-2 max-md:p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
                            >
                                <GrUpdate size={18} className="max-md:w-4 max-md:h-4" />
                            </button>
                        </div>

                    )}
                </div>

                {chatDetails.type === 'Group' && user.role==="Admin" && (
                    <div>
                        <p className="mb-2 text-lg max-md:text-10px text-yellow-600 font-semibold">Group Members:</p>
                        <ul className='h-40 bg-gray-500 rounded mb-2 grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1 justify-center overflow-y-auto p-4'>
                            {selectedChat.users.map((member) => (
                                <div key={member._id} className="mb-1 h-12 max-md:h-8 flex gap-3 items-center justify-between bg-green-600 rounded-md p-2 overflow-visible">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={member.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
                                            alt="Profile"
                                            className="h-6 w-6 max-md:h-4 max-md:w-4 rounded-full object-cover shadow-lg shadow-gray-700"
                                        />
                                        <p className='text-white text-12px max-md:text-10px whitespace-normal'>{member.name}</p>
                                        {selectedChat.groupAdmin._id === member._id && (
                                            <span className="top-0 right-0 left-5 bottom-7 text-xs text-white bg-yellow-500 p-1 rounded ml-2"><FaCrown /></span>
                                        )}
                                    </div>
                                    {isAdmin && member._id !== user._id && (
                                        <button
                                            onClick={() => handleRemoveUser(member._id)}
                                            className=" text-gray-700 hover:text-red-500 "
                                        >
                                            <RiDeleteBin5Fill size={16} className='text-red-700' />
                                        </button>
                                    )}
                                </div>

                            ))}
                        </ul>
                        {/* Add new user to the group*/}
                        <div>
                            <button
                                className='bg-gray-100 p-1 border-1px border-green-500 rounded text-green-500 text-sm max-md:text-12px hover:bg-green-100'
                                onClick={() => setToggleAddUser(!toggleAddUser)}>
                                {toggleAddUser ? 'Close' : 'Add User'}
                            </button>
                        </div>
                        {isAdmin && toggleAddUser && (
                            <div className="mt-2 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Search user by name or userName"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-1/2 px-3 py-1  max-md:px-1 max-md:py-0 text-sm max-md:text-10px border-2 border-green-500 rounded outline-none
                                            transition duration-200"
                                />

                                {/* Show search results */}
                                {loading ? (
                                    <div className="text-center"><Spin className='custom-spin'/></div> 
                                ) : (searchTerm &&
                                    <div className="searchedUserContainer bg-gray-500 max-h-40 overflow-y-auto mb-4">
                                        {searchResults.map((user) => (
                                            <div
                                                key={user._id}
                                                onClick={() => handleAddUser(user._id)}
                                                className="searchedResults flex items-center"
                                            >
                                                <div className="flex gap-1">
                                                    <img
                                                        className='h-6 w-6 max-md:h-4 max-md:w-4 rounded-full object-cover shadow-lg shadow-gray-700"'
                                                        src={user.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} alt="" />
                                                    <p className='text-white text-12px max-md:text-10px whitespace-normal'>{user.name}</p>
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
                                        onClick={confirmRemoveGroup}
                                        className='bg-gray-100 p-1 border-1px border-red-500 rounded text-red-500  text-sm max-md:text-12px hover:bg-red-100'>
                                        Delete Group
                                    </button>
                                </div>
                            )
                        }
                    </div>
                )}

                {/* Individual chat delete button */}
                {/* {chatDetails.type === 'Individual' && (
                    <div className='mt-4'>
                        <button
                            onClick={handleDeleteChat}
                            className='bg-red-400 px-2 py-2 flex items-center rounded text-white text-sm max-md:text-10px max-md:h-5'>
                            Delete Chat
                        </button>
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default EditGroup;

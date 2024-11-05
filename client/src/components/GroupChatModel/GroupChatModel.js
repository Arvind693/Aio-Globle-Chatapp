import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { FaWindowClose } from "react-icons/fa";
import './GroupChatModel.css';
import { ChatState } from '../../Context/ChatProvider';

const ChatGroupModel = ({ closeModel }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchResult, setSearchResult] = useState([]);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setSelectedChat, setChats } = ChatState();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        if (!search) {
            setSearchResult([]); // Clear the search results when input is empty
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            setError(''); // Clear previous errors
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };

                const { data } = await axios.get(`/api/user/search?q=${search}`, config);

                setSearchResult(data.data); // Update with search results
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError('Failed to fetch users. Please try again later.');
                console.error('Error fetching users:', err);
            }
        };

        fetchUsers();
    }, [search, userInfo.token]);

    const handleAddUser = (user) => {
        if (selectedUsers.includes(user)) return;
        setSelectedUsers([...selectedUsers, user]);
    };

    const handleRemoveUser = (user) => {
        setSelectedUsers(selectedUsers.filter((selected) => selected._id !== user._id));
    };

    const handleCreateGroup = async () => {
        if (!groupName || selectedUsers.length === 0) {
            message.success('Please provide a group name and select at least one user.');
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                `/api/chat/group`,
                {
                    name: groupName,
                    users: selectedUsers.map((user) => user._id),
                },
                config
            );
            message.success(`${groupName} group created successfully`, 2);
            setChats(prevChats => [...prevChats, data])
            closeModel(); // Close the model after group creation

        } catch (error) {
            console.error('Error creating group chat:', error);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-[1000]">
            <div className="createGroupContainer rounded-lg shadow-lg p-6 max-w-lg w-full">
                <h2 className="createGroupText ">Create Group Chat</h2>

                <input
                    type="text"
                    placeholder="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="groupContent"
                />

                <input
                    type="text"
                    placeholder="Search Users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="groupContent"
                />

                {/* Show search results */}
                {loading ? (
                    <div className="text-center">Loading...</div>
                ) : (search &&
                    <div className="searchedUserContainer max-h-32 overflow-y-auto mb-4">
                        {searchResult.map((user, index) => (
                            <div
                                key={index}
                                className="flex items-center p-3 mt-2 max-md:p-1 bg-gray-100 rounded-lg max-md:rounded hover:bg-gray-200 cursor-pointer"
                                onClick={() => handleAddUser(user)}
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
                                    <p className="text-gray-500 text-sm max-md:text-8px">{user.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Selected users */}
                <div className="selectedUserContainer mb-4 max-h-32 overflow-y-auto">
                    {selectedUsers.map((user) => (
                        <div
                            key={user._id}
                            className=" flex items-center justify-between p-1 mb-2 bg-gray-100 rounded "
                        >   <div className='flex gap-0.4 items-center'>
                                <div className="w-12 h-12 max-md:w-6 max-md:h-6 rounded-full overflow-hidden bg-gray-300 mr-3">
                                    <img
                                        src={user.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className='text-gray-800 text-s text-white-500 max-md:text-8px'>{user.name}</span>
                            </div>
                            <button
                                onClick={() => handleRemoveUser(user)}
                                className="text-xl max-md:text-10px text-red-500 hover:underline"
                            >
                                {<FaWindowClose />}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between mb-4">
                    <button
                        onClick={handleCreateGroup}
                        className="createGroupBtn"
                    >
                        Create Group
                    </button>
                    <button
                        onClick={closeModel}
                        className="bg-gray-500 text-white px-4 py-2 max-md:text-12px max-md:p-2 rounded hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatGroupModel;

// perfect

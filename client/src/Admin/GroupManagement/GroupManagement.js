import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminNavbar from '../AdminNavbar/AdminNavbar';
import { Avatar, Button, Input, List, message, Modal, Spin } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import EditGroup from './EditGroup';
import { ChatState } from '../../Context/ChatProvider';

const GroupManagement = () => {
    const { selectedChat, setSelectedChat, user } = ChatState();
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editGroupModelOpen, setEditGroupModelOpen] = useState(false);
    const [error, setError] = useState('');
    console.log(groups)
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));

    useEffect(() => {
        fetchGroups();
        fetchUsers();
    }, []);

    const fetchGroups = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${adminInfo.token}`,
                },
            };

            const response = await axios.get('/api/admin/groups', config);
            setGroups(response.data.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/admin/users');
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Search users
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
                        Authorization: `Bearer ${adminInfo.token}`,
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
    }, [search, adminInfo.token]);
    // Handle creating a new group
    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || selectedUsers.length === 0) {
            message.warning("Group name can't be empty and select at least one user.");
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${adminInfo.token}`,
                },
            };
            const { data } = await axios.post(`/api/chat/group`, { name: newGroupName, users: selectedUsers.map((user) => user._id) }, config);
            setNewGroupName('');
            setIsCreateGroupModalOpen(false);
            fetchGroups();
            message.success(`${newGroupName} group created successfully`, 2);
        } catch (error) {
            console.error('Error creating group:', error);
            message.error('Failed to create group.');
        }
    };

    const handleAddUser = (user) => {
        if (selectedUsers.includes(user)) return;
        setSelectedUsers([...selectedUsers, user]);
    };

    const handleRemoveUser = (user) => {
        setSelectedUsers(selectedUsers.filter((selected) => selected._id !== user._id));
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminNavbar />
            <button
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="bg-green-600 h-12 max-md:h-8 hover:bg-green-700 text-white max-md:text-xs max-md:py-2 max-md:px-2 ml-2 mt-2 font-semibold py-2 px-4 rounded transition-colors duration-200"
            >
                Create Group
            </button>

            {/* Group List */}
            <div className='w-full p-8 flex flex-col items-center'>
                <div className='w-full flex justify-center border-b-2 border-green-500'>
                    <h4 className="text-2xl max-md:text-lg font-semibold text-gray-700 mb-2">Groups</h4>
                </div>

                <div className="w-full max-w-3xl space-y-2 max-md:space-y-1 mt-2">
                    {groups.map(group => (
                        <div
                            key={group._id}
                            onClick={() => { setEditGroupModelOpen(true); setSelectedChat(group); }}
                            className=" bg-gradient-to-r from-gray-800 to-blue-600  shadow-md rounded-lg p-2 cursor-pointer transition-transform duration-300 hover:shadow-xl hover:scale-105"
                        >
                            <h5 className="text-xs text-white font-semibold">{group.chatName}</h5>
                        </div>
                    ))}
                </div>
            </div>
            {/* Create Group Modal */}
            <Modal
                title="Create Group"
                open={isCreateGroupModalOpen}
                onCancel={() => setIsCreateGroupModalOpen(false)}
                onOk={handleCreateGroup}
                okText="Create"
            >
                <Input
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                />

                <Input
                    placeholder="Search Users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-3 mt-3"
                />

                {loading ? (
                    <div className="text-center"><Spin /></div>
                ) : (
                    search && (
                        <List
                            className="mb-4 max-h-32 overflow-y-auto"
                            dataSource={searchResult}
                            renderItem={(user) => (
                                <List.Item
                                    key={user._id}
                                    onClick={() => handleAddUser(user)}
                                    className="cursor-pointer hover:bg-gray-200"
                                    style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#f0f0f0', marginBottom: '4px' }}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar src={user.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} />}
                                        title={<span className="text-gray-800 font-medium">{user.name}</span>}
                                        description={<span className="text-gray-500 text-sm">{user.userName}</span>}
                                    />
                                </List.Item>
                            )}
                        />
                    )
                )}
                {selectedUsers.length >= 1 &&
                    <div className="mb-4">
                        <p>Selected Users</p>
                        <List
                            className="max-h-32 overflow-y-auto"
                            dataSource={selectedUsers}
                            renderItem={(user) => (
                                <List.Item
                                    key={user._id}
                                    className="flex justify-between items-center bg-gray-100 rounded-lg p-2 mb-2"
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar src={user.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} />}
                                        title={<span className="text-gray-800 font-medium">{user.name}</span>}
                                    />
                                    <Button
                                        icon={<CloseOutlined />}
                                        type="text"
                                        danger
                                        onClick={() => handleRemoveUser(user)}
                                    />
                                </List.Item>
                            )}
                        />
                    </div>
                }
            </Modal>
            {editGroupModelOpen && (
                <EditGroup user={selectedChat.users.find((u) => u._id !== user._id)} onClose={() => setEditGroupModelOpen(false)} />
            )}
        </div>
    );
};

export default GroupManagement;

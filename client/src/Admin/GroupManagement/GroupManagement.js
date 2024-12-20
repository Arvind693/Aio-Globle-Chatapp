import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminNavbar from '../AdminNavbar/AdminNavbar';
import { Avatar, Button, Input, List, message, Modal, Spin } from 'antd';
import { CloseOutlined, TeamOutlined } from '@ant-design/icons';
import EditGroup from './EditGroup';
import { ChatState } from '../../Context/ChatProvider';

const GroupManagement = () => {
    const { selectedChat, setSelectedChat, user, getConfig } = ChatState();
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

    useEffect(() => {
        fetchGroups();
        fetchUsers();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await axios.get('/api/admin/groups', getConfig());
            setGroups(response.data.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/admin/users',getConfig());
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
                const { data } = await axios.get(`/api/user/search?q=${search}`, getConfig());

                setSearchResult(data.data); // Update with search results
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError('Failed to fetch users. Please try again later.');
                console.error('Error fetching users:', err);
            }
        };

        fetchUsers();
    }, [search]);
    // Handle creating a new group
    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || selectedUsers.length === 0) {
            message.warning("Group name can't be empty and select at least one user.");
            return;
        }

        try {
            const { data } = await axios.post(`/api/chat/group`, { name: newGroupName, users: selectedUsers.map((user) => user._id) }, getConfig());
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
        <div className="min-h-screen overflow-hidden"> {/* Prevent scrolling on the main screen */}
            <AdminNavbar />
            <button
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="bg-green-600 h-12 max-md:h-8 hover:bg-green-700 text-white max-md:text-xs max-md:py-2 max-md:px-2 ml-2 mt-2 font-semibold py-2 px-4 rounded transition-colors duration-200"
            >
                Create Group
            </button>

            {/* Group List */}
            <div className="w-full px-8 flex flex-col items-center">
                {/* Header */}
                <div className="w-full flex justify-center border-b-4 border-blue-500 pb-2">
                    <h4 className="text-3xl max-md:text-xl font-semibold text-gray-800">Groups</h4>
                </div>

                {/* Group List */}
                <div className="w-full p-8 max-w-3xl mt-4 space-y-3 max-md:space-y-2 h-[60vh] overflow-y-auto">
                    {groups.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-lg font-semibold">
                                No groups available. Create a new group to get started!
                            </p>
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div
                                key={group._id}
                                onClick={() => {
                                    setEditGroupModelOpen(true);
                                    setSelectedChat(group);
                                }}
                                className="flex items-center bg-white shadow-lg rounded-lg p-4 cursor-pointer transition-transform duration-300 hover:shadow-xl hover:scale-105 border-l-4 border-blue-500"
                            >
                                {/* Group Icon */}
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex justify-center items-center text-white text-xl font-bold mr-4">
                                    <TeamOutlined style={{ fontSize: '24px' }} />
                                </div>

                                {/* Group Name */}
                                <div className="flex-1">
                                    <h5 className="text-lg text-gray-800 font-semibold">{group.chatName}</h5>
                                    <p className="text-sm text-gray-500">Click to manage this group</p>
                                </div>
                            </div>
                        ))
                    )}
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
                    <div className="text-center">
                        <Spin />
                    </div>
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
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        backgroundColor: '#f0f0f0',
                                        marginBottom: '4px',
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar
                                                src={
                                                    user.profileImage ||
                                                    'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'
                                                }
                                            />
                                        }
                                        title={<span className="text-gray-800 font-medium">{user.name}</span>}
                                        description={<span className="text-gray-500 text-sm">{user.userName}</span>}
                                    />
                                </List.Item>
                            )}
                        />
                    )
                )}
                {selectedUsers.length >= 1 && (
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
                                        avatar={
                                            <Avatar
                                                src={
                                                    user.profileImage ||
                                                    'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'
                                                }
                                            />
                                        }
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
                )}
            </Modal>
            {editGroupModelOpen && (
                <EditGroup groups={groups} setGroups={setGroups} onClose={() => setEditGroupModelOpen(false)} />
            )}
        </div>
    );

};

export default GroupManagement;

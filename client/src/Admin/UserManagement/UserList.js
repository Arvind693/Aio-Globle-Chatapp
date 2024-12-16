import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { message, Modal } from 'antd';
import AllowedContact from './AllowedContact';
import AddContactPopup from './AddContactPopup';
import { AiFillDelete, AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import UserChatHistory from './UserChatHistory';

const UserList = ({ users, setUsers, fetchUsers, showModal }) => {
    const [isAddContactPopupVisible, setIsAddContactPopupVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState({});
    const [isSaveButtonEnabled, setIsSaveButtonEnabled] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState(users);
    const [passwordVisibility, setPasswordVisibility] = useState({});
    const [isChatHistoryVisible, setIsChatHistoryVisible] = useState(false);
    const [chatUserId, setChatUserId] = useState(null);

    useEffect(() => {
        const initialPermissions = users.reduce((acc, user) => {
            acc[user._id] = user.permissions;
            return acc;
        }, {});
        setSelectedPermissions(initialPermissions);
    }, [users]);

    useEffect(() => {
        // Filter users based on the search query
        const lowerCaseQuery = searchQuery.toLowerCase();
        setFilteredUsers(
            users.filter(
                (user) =>
                    user.name.toLowerCase().includes(lowerCaseQuery) ||
                    user.userName.toLowerCase().includes(lowerCaseQuery)
            )
        );
    }, [searchQuery, users]);

    const showAddContactPopup = (userId) => {
        setSelectedUserId(userId);
        setIsAddContactPopupVisible(true);
    };

    const handlePermissionChange = (userId, permissionName, isChecked) => {
        setSelectedPermissions((prevPermissions) => ({
            ...prevPermissions,
            [userId]: {
                ...prevPermissions[userId],
                [permissionName]: isChecked,
            },
        }));

        setIsSaveButtonEnabled((prev) => ({
            ...prev,
            [userId]: true, // Enable the save button for this user
        }));
    };

    const handleSavePermissions = async (userId) => {
        try {
            const updatedPermissions = selectedPermissions[userId];
            await axios.put(`/api/admin/permissions/${userId}`, updatedPermissions);
            message.success('Permissions updated successfully', 2);

            // Refresh the users list from the server after saving to sync UI with backend data
            await fetchUsers();

            // Disable save button after successful save
            setIsSaveButtonEnabled((prev) => ({
                ...prev,
                [userId]: false,
            }));
        } catch (error) {
            message.error('Failed to update permissions.', 2);
        }
    };

    const handleRemoveUser = async (userId) => {
        try {
            const response = await axios.delete(`/api/admin/users/${userId}`);
            if (response.status === 200) {
                setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
                message.success(response.data.message, 2);
            }
        } catch (error) {
            console.error('Error removing user:', error);
            message.error('Failed to remove user. Please try again.');
        }
    };

    const confirmRemoveUser = (userId) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this user?',
            content: 'This action cannot be undone.',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: () => handleRemoveUser(userId),
        });
    };


    const handleRemoveContact = async (userId, contactId) => {
        try {
            const response = await axios.delete(`/api/admin/${userId}/contacts/${contactId}`);
            if (response.status === 200) {
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user._id === userId
                            ? {
                                ...user,
                                allowedContacts: user.allowedContacts.filter((id) => id !== contactId),
                            }
                            : user
                    )
                );
                message.success('Contact removed successfully');
            }
        } catch (error) {
            console.error('Error removing contact:', error);
            message.error('Failed to remove contact. Please try again.');
        }
    };
    const togglePasswordVisibility = (userId) => {
        setPasswordVisibility((prev) => ({
            ...prev,
            [userId]: !prev[userId],
        }));
    };

    const handleViewChatHistory = (user) => {
        setChatUserId(user._id);
        setIsChatHistoryVisible(true);
    };

    return (
        <div className='bg-transparent'>
            <div className="flex flex-col max-md:flex-col md:flex-row justify-center md:gap-10 max-md:gap-4 p-2 items-center bg-gradient-to-r from-gray-800 to-blue-600 shadow-lg rounded mb-8">
                <p className="text-lg max-md:text-sm font-bold text-white tracking-wide font-sans text-center">
                    Registered Users List
                </p>
                <input
                    type="text"
                    placeholder="Search by name or username"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-sm max-md:text-xs px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full max-md:w-auto md:max-w-md"
                />
                <div className="text-center mt-4 md:mt-0">
                    <button
                        onClick={showModal}
                        className="px-4 py-2 max-md:text-xs bg-gradient-to-t from-green-500 to-green-600 text-white rounded hover:bg-green-700 shadow-lg hover:shadow-xl transition-shadow duration-200"
                    >
                        Register New User
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <div key={user._id} className="bg-gray-50 p-4 rounded-lg shadow-md">
                            <div className="flex items-center justify-between">
                                <div className='flex gap-1 items-center'>
                                    <img src={user.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
                                        alt={user.name} className={`h-10 w-10 max-md:w-6 max-md:h-6 max-md:border-2 rounded-full border-2 
                                            ${user.isOnline
                                                ? 'border-green-500 animate-borderPulse'
                                                : ''}`}
                                    />
                                    <div>
                                        <p className='text-10px'>Username: {user.userName}</p>
                                        <div className="relative flex items-center">
                                            <input
                                                type={
                                                    passwordVisibility[user._id] ? 'text' : 'password'
                                                }
                                                value={user.password}
                                                readOnly
                                                className="bg-transparent text-10px w-16 rounded px-1 py-0.5 pr-8 focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility(user._id)}
                                                className="absolute right-5 text-gray-500 hover:text-gray-700"
                                            >
                                                {passwordVisibility[user._id] ? (
                                                    <AiFillEyeInvisible size={16} />
                                                ) : (
                                                    <AiFillEye size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <h5 className="text-sm font-semibold">{user.name}</h5>
                                <button
                                    onClick={() => confirmRemoveUser(user._id)}
                                    className="text-red-500 hover:text-red-700 transition"
                                    title="Remove User"
                                >
                                    <AiFillDelete size={20} />
                                </button>
                            </div>
                            {/* <div className="mt-4">
                            <h6 className="font-medium text-sm text-gray-700">Permissions:</h6>
                            <div className="flex flex-col space-y-2 mt-2">
                                {Object.keys(user.permissions).map((perm) => (
                                    <div key={perm} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className='cursor-pointer'
                                            checked={
                                                selectedPermissions[user._id]?.[perm] ?? false
                                            }
                                            onChange={(e) =>
                                                handlePermissionChange(user._id, perm, e.target.checked)
                                            }
                                        />
                                        <label className="ml-2 text-10px">{perm}</label>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleSavePermissions(user._id)}
                                className={`mt-2 text-xs text-white px-2 py-1 rounded ${isSaveButtonEnabled[user._id] ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'} 
                                transition-colors duration-200`}
                                disabled={!isSaveButtonEnabled[user._id]}
                            >
                                Save Permissions
                            </button>
                        </div> */}
                            {/* View User Chat History */}
                            <button
                                onClick={() => handleViewChatHistory(user)}
                                className="mt-2 text-12px bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                            >
                                View Chat History
                            </button>
                            <div className="mt-4">
                                <h6 className="font-medium text-sm text-gray-700">Allowed Contacts</h6>
                                <div className="flex flex-wrap space-x-2 mt-2">
                                    {user.allowedContacts?.length > 0 ? (
                                        user.allowedContacts.map((contactId) => (
                                            <AllowedContact
                                                key={contactId}
                                                userId={user._id}
                                                contactId={contactId}
                                                onRemove={handleRemoveContact}
                                            />
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No allowed contacts.</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => showAddContactPopup(user._id)}
                                    className="mt-2 px-2 py-1 text-12px bg-green-500 text-white rounded hover:bg-green-600 transition duration-200"
                                >
                                    Add Allowed Contact
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="absolute text-center text-lg font-medium max-md:text-sm text-gray-600  w-full ">
                        No registered users available.
                    </p>
                )}
                <AddContactPopup
                    visible={isAddContactPopupVisible}
                    onClose={() => setIsAddContactPopupVisible(false)}
                    userId={selectedUserId}
                    onContactAdded={fetchUsers}
                />
                <UserChatHistory
                    visible={isChatHistoryVisible}
                    onClose={() => setIsChatHistoryVisible(false)}
                    userId={chatUserId}
                />
            </div>
        </div>
    );
};

export default UserList;

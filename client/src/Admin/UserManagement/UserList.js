import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { message,Modal } from 'antd';
import AllowedContact from './AllowedContact';
import AddContactPopup from './AddContactPopup';
import { AiFillDelete} from 'react-icons/ai';

const UserList = ({ users, setUsers, fetchUsers }) => {
    const [isAddContactPopupVisible, setIsAddContactPopupVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState({});
    const [isSaveButtonEnabled, setIsSaveButtonEnabled] = useState({});
    const [searchQuery, setSearchQuery] = useState(''); 
    const [filteredUsers, setFilteredUsers] = useState(users);

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
                message.success(response.data.message,2);
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

    return (
        <div className='bg-transparent'>
            <div className=" flex justify-center gap-10 p-2 items-center  bg-gradient-to-r from-gray-800 to-blue-600 shadow-lg rounded mb-8">
                <p className="text-lg font-bold text-white tracking-wide font-sans">Registered Users List</p>
                <input
                    type="text"
                    placeholder="Search by name or username"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-12px px-2 py-1 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
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
                                    <p className='text-10px'>Password: {user.password}</p>
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
                        <div className="mt-4">
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
                        </div>

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
                ))}
                <AddContactPopup
                    visible={isAddContactPopupVisible}
                    onClose={() => setIsAddContactPopupVisible(false)}
                    userId={selectedUserId}
                    onContactAdded={fetchUsers}
                />
            </div>
        </div>
    );
};

export default UserList;

import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import { message } from 'antd';
import AllowedContact from './AllowedContact';
import AddContactPopup from './AddContactPopup';

const UserList = ({ users, setUsers, fetchUsers }) => {
    const [isAddContactPopupVisible, setIsAddContactPopupVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState({});
    const [isSaveButtonEnabled, setIsSaveButtonEnabled] = useState({}); // Track button state for each user

    useEffect(() => {
        // Initialize selectedPermissions based on the current users' permissions data
        const initialPermissions = users.reduce((acc, user) => {
            acc[user._id] = user.permissions;
            return acc;
        }, {});
        setSelectedPermissions(initialPermissions);
    }, [users]);

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
            <div className="w-full flex justify-center items-center bg-gradient-to-r from-gray-500 to-gray-600 py-2 shadow-lg rounded-lg mb-8">
                <p className="text-3xl font-bold text-white tracking-wide font-sans">Registered Users List</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <div key={user._id} className="bg-gray-50 p-4 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <img src={user.profileImage} alt={user.name} className="h-12 w-12 rounded-full" />
                            <h5 className="text-lg font-semibold">{user.name}</h5>
                        </div>
                        <div className="mt-4">
                            <h6 className="font-medium text-gray-700">Permissions:</h6>
                            <div className="flex flex-col space-y-2 mt-2">
                                {Object.keys(user.permissions).map((perm) => (
                                    <div key={perm} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedPermissions[user._id]?.[perm] ?? false
                                            }
                                            onChange={(e) =>
                                                handlePermissionChange(user._id, perm, e.target.checked)
                                            }
                                        />
                                        <label className="ml-2">{perm}</label>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleSavePermissions(user._id)}
                                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                                disabled={!isSaveButtonEnabled[user._id]} // Disable if no checkbox has been changed
                            >
                                Save Permissions
                            </button>
                        </div>

                        <div className="mt-4">
                            <h6 className="font-medium text-gray-700">Allowed Contacts</h6>
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
                                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
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

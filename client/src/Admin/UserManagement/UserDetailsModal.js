import React from 'react';
import { Modal, Button, message } from 'antd';
import axios from 'axios';

const UserDetailsModal = ({ open, onClose, user = {}, fetchUsers }) => {
    const handleUpdateRole = async (userId, role) => {
        if ( user.role === 'Admin') {
            Modal.confirm({
                title: `Are you sure you want to revoke ${user.name}'s admin rights?`,
                content: (
                    <div>
                        <p>
                            Warning: By revoking admin privileges, this user will lose full access to the platform and no longer be able to manage user roles, permissions, and critical settings.
                        </p>
                    </div>
                ),
                okText: 'Yes, revoke admin',
                cancelText: 'Cancel',
                onOk: async () => {
                    try {
                        const response = await axios.put(`/api/admin/make-admin/${userId}`, { role: 'User' });
                        if (response.data && response.data.message) {
                            message.success(response.data.message, 3);
                        } else {
                            message.success(`${user.name}'s admin privileges have been revoked.`, 3);
                        }
                        fetchUsers();
                        onClose();
                    } catch (error) {
                        const errorMessage =
                            error.response && error.response.data && error.response.data.message
                                ? error.response.data.message
                                : 'Failed to revoke admin status. Please try again.';

                        message.error(errorMessage, 3);
                    }
                },
            });
            return;
        }
        Modal.confirm({
            title: `Are you sure you want to make ${user.name} an Admin?`,
            content: (
                <div>
                    <p>
                        Warning: By making this user an admin, they will have full access to the platform and can modify user roles, permissions, and other critical settings.
                    </p>
                </div>
            ),
            okText: 'Yes, make Admin',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await axios.put(`/api/admin/make-admin/${userId}`, { role });
                    if (response.data && response.data.message) {
                        message.success(response.data.message, 3);
                    } else {
                        message.success(`${user.name} is now an admin.`, 3);
                    }
                    fetchUsers();
                    onClose();
                } catch (error) {
                    const errorMessage =
                        error.response && error.response.data && error.response.data.message
                            ? error.response.data.message
                            : 'Failed to update admin status. Please try again.';

                    message.error(errorMessage, 3);
                }
            },
        });
    };

    return (
        <Modal
            title="User Details"
            open={open}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button
                    key="makeAdmin"
                    type="primary"
                    onClick={() =>
                        handleUpdateRole(
                            user._id,
                            user.role === 'Admin' ? 'User' : 'Admin'
                        )
                    }
                    disabled={!user._id} // Disable if no user ID is provided
                >
                    {user.role === 'Admin' ? 'Revoke Admin' : 'Make Admin'}
                </Button>,
            ]}
        >
            {user && user._id ? (
                <div className="flex items-center gap-4">
                    <img
                        src={
                            user.profileImage ||
                            'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'
                        }
                        alt={user.name || 'Anonymous'}
                        className="h-20 w-20 max-md:h-8 max-md:w-8 rounded-full border border-gray-300 object-cover "
                    />
                    <div>
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        <p className="text-gray-600">Username: {user.userName}</p>
                    </div>
                </div>
            ) : (
                <p className="text-gray-500">No user details available.</p>
            )}
        </Modal>
    );
};

export default UserDetailsModal;

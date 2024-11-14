import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { message, Spin } from 'antd';
import UserList from '../UserManagement/UserList';
import AdminNavbar from '../AdminNavbar/AdminNavbar';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [toggleAddUser, setToggleAddUser] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allowedContactsNames, setAllowedContactsNames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        userName: '',
        password: '',
        allowedContacts: [],
        permissions: {
            canMessage: false,
            canScreenShare: false,
            canCall: false,
            canGroupChat: false,
        },
    });
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));

    useEffect(() => {
        fetchUsers();
        initializeAdminChats();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/admin/users');
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Search user functionality
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchTerm) {
                setSearchResults([]);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${adminInfo.token}`,
                    },
                };

                const { data } = await axios.get(`/api/admin/search?q=${searchTerm}`, config);

                setSearchResults(data.data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError('Failed to fetch users. Please try again later.');
                console.error('Error fetching users:', err);
            }
        };

        searchUsers();
    }, [searchTerm]);

    // Add New User to Allowed Contacts Functionality
    const handleAddUser = async (userId) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminInfo?.token}`,
                },
            };

            // Fetch user data from the backend
            const response = await axios.get(`/api/admin/getuser/${userId}`, config);
            const { name, _id } = response.data;
            setAllowedContactsNames((prevNames) => {
                if (!prevNames.includes(name)) {
                    return [...prevNames, name];
                }
                return prevNames;
            });
            setFormData((prevFormData) => ({
                ...prevFormData,
                allowedContacts: [...prevFormData.allowedContacts, response.data._id],
            }));
        } catch (error) {
            message.error('Failed to add user to the group', 2);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData({
                ...formData,
                permissions: {
                    ...formData.permissions,
                    [name]: checked,
                },
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminInfo?.token}`,
                },
            };
            await axios.post('/api/admin/registeruser', formData, config);
            message.success('User registered successfully');
            setFormData({
                name: '',
                userName: '',
                password: '',
                permissions: {
                    canMessage: false,
                    canScreenShare: false,
                    canCall: false,
                    canGroupChat: false,
                },
            });

            setLoading(false)
            fetchUsers();
        } catch (error) {
            message.error(error.response.data.error, 2);
        }
    };

    const initializeAdminChats = async () => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminInfo?.token}`,
                },
            };
            
            // Set request body to `null` if no data needs to be sent
            await axios.post(`/api/chat/initialize-admin-chats`, {}, config);
            
            console.log("Admin created chat with all users");
        } catch (error) {
            console.log("Chat Creation failed with admin and all users", error);
        }
    };
    

    return (
        <div className="min-h-screen p-0 bg-gray-300">
            <AdminNavbar/>

            {/* User Registration Form */}
            <form
                onSubmit={handleRegister}
                className="bg-white shadow-lg rounded-lg p-6 mb-10 mt-2 max-w-lg mx-auto border border-gray-200 transition-transform duration-200 hover:shadow-2xl"
            >
                <h4 className="text-2xl font-semibold text-gray-700 mb-4">Register New User</h4>
                <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                />
                <input
                    type="text"
                    name="userName"
                    placeholder="Username"
                    value={formData.userName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                />

                {/* Permissions Section */}
                <div className="mb-4">
                    <label className="text-gray-800 font-semibold mb-2 block">Set Permissions:</label>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.keys(formData.permissions).map((permission) => (
                            <label key={permission} className="inline-flex items-center text-sm">
                                <input
                                    type="checkbox"
                                    name={permission}
                                    checked={formData.permissions[permission]}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                {permission.replace('can', 'Can ')}
                            </label>
                        ))}
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full py-2 mt-4 bg-green-600 text-white rounded font-semibold hover:bg-blue-700 transition duration-200"
                >
                    {loading? <Spin size='small'/>: "Register User"}
                </button>
            </form>

            {/* Registered Users List */}
            <div className='p-8'>
            <UserList users={users} setUsers={setUsers} fetchUsers={fetchUsers} />
            </div>
        </div>
    );
};

export default UserManagement;

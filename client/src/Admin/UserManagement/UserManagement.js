import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { CopyOutlined } from '@ant-design/icons';
import {AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { message, Spin, Modal } from 'antd';
import UserList from '../UserManagement/UserList';
import AdminNavbar from '../AdminNavbar/AdminNavbar';
import { ChatState } from '../../Context/ChatProvider';

const serverHost = process.env.REACT_APP_SERVER_HOST;
const ENDPOINT = process.env.NODE_ENV === "production"
    ? "https://aio-globle-chatapp.onrender.com"
    : `http://${serverHost}:5000`;

let socket = io(ENDPOINT);

const UserManagement = () => {
    const {getConfig} = ChatState();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [siteUrl, setSiteUrl] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordMismatch, setPasswordMismatch] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        userName: '',
        password: '',
        confirmPassword: '',
        allowedContacts: [],
        permissions: {
            canMessage: false,
            canScreenShare: false,
            canCall: false,
            canGroupChat: false,
        },
    });

    const [isModalVisible, setIsModalVisible] = useState(false);
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
    const admin = adminInfo?.user;

    useEffect(() => {
        socket.on('update-user-status', ({ userId, isOnline }) => {
            // Update local state with the user's new status
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user._id === userId ? { ...user, isOnline } : user
                )
            );
        });

        return () => {
            socket.off('update-user-status');
        };
    }, [socket]);
 
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/admin/users', getConfig());
            const filteredUsers = response.data.data.filter(
                (u) => u._id !== admin?._id
            );
            setUsers(filteredUsers);
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
                const { data } = await axios.get(`/api/admin/search?q=${searchTerm}`, getConfig());

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
        if (formData.password !== formData.confirmPassword) {
            setPasswordMismatch(true);
            return;
        }

        setPasswordMismatch(false);
        setLoading(true);
        try {
            const { name, userName, password, permissions } = formData;
            await axios.post('/api/admin/registeruser', { name, userName, password, permissions }, getConfig());
            message.success('User registered successfully');
            setFormData({
                name: '',
                userName: '',
                password: '',
                confirmPassword: '',
                permissions: {
                    canMessage: false,
                    canScreenShare: false,
                    canCall: false,
                    canGroupChat: false,
                },
            });

            setLoading(false);
            setIsModalVisible(false);
            initializeAdminChats(); 
            fetchUsers();
        } catch (error) {
            setLoading(false);
            message.error(error.response.data.error, 2);
        }
    };

    const initializeAdminChats = async () => {
        try {
            // Set request body to `null` if no data needs to be sent
            await axios.post(`/api/chat/initialize-admin-chats`, {}, getConfig());

            console.log("Admin created chat with all users");
        } catch (error) {
            console.log("Chat Creation failed with admin and all users", error);
        }
    };

    useEffect(() => {
        // Get the site URL dynamically based on the environment
        const url = `http://${serverHost}:3000`;
        setSiteUrl(url);
    }, []);

    const handleCopyUrl = () => {
        // Check if Clipboard API is available
        if (navigator.clipboard) {
            // Clipboard API (modern browsers)
            navigator.clipboard.writeText(siteUrl)
                .then(() => {
                    message.success('Site URL copied to clipboard!');
                })
                .catch(() => {
                    message.error('Failed to copy URL using Clipboard API.');
                });
        } else {
            // Fallback: Using document.execCommand (older browsers)
            const textArea = document.createElement("textarea");
            textArea.value = siteUrl;
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                message.success('Site URL copied to clipboard!');
            } else {
                message.error('Failed to copy URL using execCommand.');
            }
        }
    };

    const showModal = () => {
        setIsModalVisible(true);
    };

    // Function to hide the modal
    const handleCancel = () => {
        setIsModalVisible(false);
    };
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen p-0 bg-gray-300">
            <AdminNavbar />
            {/* Site URL Section */}
            {/* <div className="bg-white shadow-lg rounded-lg p-6 mb-10 max-md:mb-3 mt-2 max-w-lg mx-auto max-md:w-72 border border-gray-200 text-center">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Share Site URL</h4>
                <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                    <span className="text-gray-700 text-sm truncate">{siteUrl}</span>
                    <button
                        onClick={handleCopyUrl}
                        className="px-4 py-2 max-md:text-xs bg-gradient-to-t from-green-500 to-green-600  text-white rounded hover:bg-green-700"
                        title="Copy URL"
                    >
                        <CopyOutlined />
                    </button>
                </div>
            </div> */}

            {/* Modal for User Registration */}
            <Modal
                title="Register New User"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={400}
            >
                <form onSubmit={handleRegister}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-2 py-1 border-2 text-sm mb-4 border-green-500 rounded outline-none"
                        required
                    />
                    <input
                        type="text"
                        name="userName"
                        placeholder="Username"
                        value={formData.userName}
                        onChange={handleChange}
                        className="w-full px-2 py-1 border-2 text-sm mb-4 border-green-500 rounded outline-none"
                        required
                    />
                    <div className="relative mb-4">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-2 py-1 border-2 text-sm border-green-500 rounded outline-none"
                            required
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
                        >
                            {showPassword ?  <AiFillEyeInvisible size={window.innerWidth < 640 ? 16 : 20} />: <AiFillEye size={window.innerWidth < 640 ? 16 : 20}/>}
                        </button>
                    </div>
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-2 py-1 border-2 text-sm mb-4 ${
                            passwordMismatch ? 'border-red-500' : 'border-green-500'
                        } rounded outline-none`}
                        required
                    />
                    {passwordMismatch && (
                        <p className="text-red-500 text-sm mb-4">Passwords do not match</p>
                    )}
                    {/* <div className="mb-4">
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
                    </div> */}
                    <button
                        type="submit"
                        className="w-full py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition duration-200"
                    >
                        {loading ? <Spin size="small" /> : "Register User"} 
                    </button>
                </form>
            </Modal>

            {/* Registered Users List */}
            <div className='p-8'>
                <UserList users={users} setUsers={setUsers} fetchUsers={fetchUsers} showModal={showModal}/>
            </div>
        </div>
    );
};

export default UserManagement;

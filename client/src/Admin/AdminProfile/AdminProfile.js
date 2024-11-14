import React, { useEffect, useState } from 'react';
import { FaEdit, FaWindowClose } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { ChatState } from '../../Context/ChatProvider';
import axios from 'axios';
import { message, Spin } from 'antd';

const AdminProfile = ({ onToggle }) => {
    const { user, setUser, adminLogout } = ChatState();
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));

    const [newName, setNewName] = useState('');
    const [newProfileImage, setNewProfileImage] = useState(user?.profileImage);
    const [toggleUpdateName, setToggleUpdateName] = useState(false);
    const [toggleUpdateProfile, setToggleUpdateProfile] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            if (!adminInfo) throw new Error("Admin info not available.");

            const config = {
                headers: {
                    Authorization: `Bearer ${adminInfo.token}`,
                    'Content-Type': 'multipart/form-data',
                },
            };

            const formData = new FormData();

            formData.append("name", newName);

            if (newProfileImage instanceof File) {
                formData.append("profileImage", newProfileImage);
            }
            const { data } = await axios.put(`/api/user/update-user`, formData, config);

            if (data.user) {
                setUser({
                    ...user,
                    name: data.user.name,
                    profileImage: data.user.profileImage,
                });

                // Update user info in local storage
                const updatedadminInfo = {
                    ...adminInfo,
                    user: {
                        ...adminInfo.user,
                        name: data.user.name,
                        profileImage: data.user.profileImage,
                    },
                };
                localStorage.setItem('adminInfo', JSON.stringify(updatedadminInfo));
            }

            message.success(data.message, 2);
            setToggleUpdateName(false);
            setToggleUpdateProfile(false);
        } catch (error) {
            if (error.response) {
                message.error(`Error updating profile: ${error.response.data.message || error.message}`, 2);
            } else {
                message.error(`Error updating profile: ${error.message}`, 2);
            }
        } finally {
            setLoading(false);
        }
    };

    const navigate = useNavigate();

    useEffect(() => {
        setNewName(user?.name || '');
    }, [user]);

    const handleLogout = () => {
        adminLogout();
        navigate('/');
    };

    return (
        <div className="w-64 absolute bg-gray-800 top-20 right-3 p-5 rounded-b-lg shadow-lg z-50 animate-fadeInSlideUp">
            <FaWindowClose
                onClick={onToggle}
                className='text-white relative left-52 bottom-4 hover:text-red-500' />

            {/* User Image and Name */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3 mb-4 transition-colors duration-300 hover:bg-gray-600">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center border-2 border-yellow-400 transition-transform duration-300 hover:scale-110">
                    <img
                        className='w-full h-full object-cover rounded-full'
                        src={user.profileImage}
                        alt="User profile"
                    />
                </div>
                <div
                    onClick={() => setToggleUpdateProfile(!toggleUpdateProfile)}
                    className="flex items-center text-white gap-2 cursor-pointer transition-colors duration-300 hover:text-yellow-400">
                    <span className="text-sm">Edit Profile</span><FaEdit />
                </div>
            </div>

            {toggleUpdateProfile && (
                <div className='flex flex-col m-2 justify-center items-center gap-0'>
                    <input
                        className='text-sm text-white ml-2'
                        type="file"
                        onChange={(e) => setNewProfileImage(e.target.files[0])}
                    />
                    <button
                        className='text-sm bg-green-600 p-1 w-20 rounded text-white'
                        onClick={handleUpdateProfile}
                        disabled={loading} // Disable button while loading
                    >
                        {loading ? <Spin size="small" /> : 'Update'} {/* Show loader if loading */}
                    </button>
                </div>
            )}

            {/* User Name and userName */}
            <div className="text-white text-left text-base">
                <div>
                    <p
                        onClick={() => setToggleUpdateName(!toggleUpdateName)}
                        className="mb-2 flex items-center gap-2 transition-colors duration-300 hover:text-yellow-400">
                        <span>{user.name}</span>
                        <FaEdit />
                    </p>
                    {toggleUpdateName && (
                        <div className='flex '>
                            <input
                                type="text"
                                className='text-black text-sm rounded-l p-1 '
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                            <button
                                className='text-sm bg-green-600 p-1 border-2 border-green-600 rounded-r'
                                onClick={handleUpdateProfile}
                                disabled={loading} // Disable button while loading
                            >
                                {loading ? <Spin size="small" /> : 'Update'} {/* Show loader if loading */}
                            </button>
                        </div>
                    )}
                    <p className="mb-2 flex items-center gap-2 transition-colors duration-300 hover:text-yellow-400">
                        <FaUser /> <span>{user.userName}</span>
                    </p>
                    <p
                        onClick={handleLogout}
                        className="mb-2 flex items-center gap-2 cursor-pointer transition-colors duration-300 hover:text-red-600"
                    >
                        <FiLogOut /> Logout
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faRobot } from '@fortawesome/free-solid-svg-icons';
import AutoResponseSidebar from '../AutoResponseSidebar/AutoResponseSidebar';
import UserProfile from '../UserProfile/UserProfile';
import './Navbar.css';
import logo1 from '../../Assets/images/aio-globel1.png';
import { ChatState } from '../../Context/ChatProvider';
import axios from 'axios';

const Navbar = () => {
    const { setSelectedChat, user, notification, setNotification } = ChatState();
    const [toggleProfile, setToggleProfile] = useState(false);
    const [openAutoResponseSidebar, setOpenAutoResponseSidebar] = useState(false);

    const fetchAllNotifications = async () => {
        if(!user._id){
            return;
        }
        try {
            const response = await axios.get(`/api/message/fetch-notification/${user._id}`);
            setNotification(response.data.notifications);
        } catch (error) {
            console.log("Failed to fetching notifications")
        }
    }

    useEffect(() => {
        fetchAllNotifications();
    }, [user])

    const handleToggleAutoResponseSidebar = () => {
        setOpenAutoResponseSidebar(prevState => !prevState);
    };

    const handleToggleProfile = () => {
        setToggleProfile(!toggleProfile);
    }; 


    return (
        <nav className="bg-gradient-to-r from-white via-pink-400 to-purple-600 p-4 max-md:p-2">
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo/Brand Name */}
                <div className="text-white text-xl font-bold flex items-center gap-3 w-24 max-sm:w-12">
                    <img src={logo1} alt="AIO-Globel Logo" />
                </div>
                {/* get instant response Button */}
                <button
                    onClick={handleToggleAutoResponseSidebar}
                    className="max-md:text-8px max-md:rounded flex items-center px-4 py-2 max-md:px-2 max-md:py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-full shadow-lg hover:from-blue-700 hover:to-blue-600 transition duration-300 ease-in-out"
                >
                    <FontAwesomeIcon icon={faRobot} className="mr-2 text-lg max-md:text-xs" /> {/* Icon */}
                    Get Assistant
                </button>
                {/* Right Side Icons and Features */}
                <div className="flex gap-10 max-sm:gap-2 max-sm:ml-2">
                    {/* User Profile */}
                    <div
                        className="flex items-center space-x-4 cursor-pointer"
                        onClick={handleToggleProfile}
                    >
                        <div className="text-white font-semibold max-sm:hidden">{user.name}</div>
                        <div className="relative w-10 h-10 max-sm:w-5 max-sm:h-5 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold hover:scale-110 transition-transform duration-300">
                            {user.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt="User Profile"
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <span>{user.name[0]}</span>
                            )}
                        </div>
                    </div>

                    {toggleProfile && <UserProfile onToggle={handleToggleProfile} />}
                    {openAutoResponseSidebar && <AutoResponseSidebar isOpen={openAutoResponseSidebar} onClose={handleToggleAutoResponseSidebar} />}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
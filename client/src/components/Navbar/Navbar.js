import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { MdGroups } from "react-icons/md";
import { CiSearch } from "react-icons/ci";
import UserProfile from '../UserProfile/UserProfile';
import ChatGroupModel from '../GroupChatModel/GroupChatModel';
import SearchUserSidebar from '../SearchUserSidebar/SearchUserSidebar';
import logo1 from '../../Assets/images/aio-globel1.png';
import { ChatState } from '../../Context/ChatProvider';

const Navbar = () => {
    const [toggleProfile, setToggleProfile] = useState(false);
    const [showGroupModel, setShowGroupModel] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
     const {user} = ChatState();
    // const user = JSON.parse(localStorage.getItem('userInfo'))?.user || { name: "Shubham", profileImage: null };
    const toggleUserSearch = () => {
        setIsSidebarOpen((prev) => !prev);
    };
    
    const handleToggleProfile =()=>{
        setToggleProfile(!toggleProfile);
    }
    
   
    

    return (
        <nav className="bg-gradient-to-r from-white via-pink-400 to-purple-600 p-4">
            <div className="container mx-auto flex justify-between items-center">

                {/* Logo/Brand Name */}
                <div className="text-white text-xl font-bold flex items-center gap-3 w-24">
                    <img src={logo1} alt="AIO-Globel Logo" />
                </div>

                <div className='flex gap-20'>
                    {/* Search Bar Button */}
                    <div className="searchForNewUser flex gap-2 items-center bg-customYellow hover:bg-yellow-400 rounded-lg py-3 px-4" onClick={toggleUserSearch}>
                        <h1 className='text-2xl text-gray-900 font-bold'><CiSearch /></h1>
                        <p>Search for new User</p>
                    </div>
                    {isSidebarOpen && <SearchUserSidebar toggleUserSearch={toggleUserSearch} />}

                    {/* Create Group Button */}
                    <div className="searchForNewUser flex gap-2 items-center bg-customYellow hover:bg-yellow-400 rounded-lg py-3 px-4" onClick={() => setShowGroupModel(true)}>
                        <p className='text-2xl text-gray-900'><MdGroups /></p>
                        <p>Create New Group</p>
                    </div>
                    {showGroupModel && <ChatGroupModel closeModel={() => setShowGroupModel(false)} />}
                </div>

                <div className='flex gap-10'>
                    {/* Notification Icon */}
                    <div className="text-white mr-4 mt-3">
                        <FontAwesomeIcon icon={faBell} className="text-xl" />
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={handleToggleProfile} >
                        <div className="text-white font-semibold">{user.name}</div>
                        
                        {/* Profile Image with Hover Effect */}
                        <div className="relative w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold hover:scale-110 transition-transform duration-300">
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

                    {/* User Profile Dropdown */}
                    {toggleProfile && (<UserProfile onToggle={handleToggleProfile} />)}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

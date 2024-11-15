import React, { useState } from 'react';
import { MenuOutlined, LogoutOutlined, UserOutlined, GroupOutlined, RobotOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChatState } from '../../Context/ChatProvider';
import logo1 from '../../Assets/images/aio-globel1.png';
import AdminProfile from '../AdminProfile/AdminProfile';

const AdminNavbar = () => {
    const { adminLogout } = ChatState();
    const navigate = useNavigate();
    const location = useLocation();  // Get the current path
    const [isNavbarOpen, setNavbarOpen] = useState(false);
    const [toggleProfile, setToggleProfile] = useState(false);

    const user = JSON.parse(localStorage.getItem('adminInfo')).user;

    const handleLogout = () => {
        adminLogout();
        navigate('/');
    };

    const handleToggleProfile = () => {
        setToggleProfile(!toggleProfile);
    }
    const menuItems = [
        { key: '/chat', label: 'Chats Place', icon: <MessageOutlined />, path: '/chat' },
        { key: '/admin/userManagement', label: 'User Management', icon: <UserOutlined />, path: '/admin/userManagement' },
        { key: '/admin/groupManagement', label: 'Group Management', icon: <GroupOutlined />, path: '/admin/groupManagement' },
        { key: '/admin/autoResponsesManagement', label: 'Auto Response Management', icon: <RobotOutlined />, path: '/admin/autoResponsesManagement' },
    ];

    return (
        <div className="sticky top-0 w-full">
            <header className="bg-gradient-to-r from-white via-pink-400 to-purple-600 text-white py-4 px-6 flex items-center justify-between shadow-md sticky top-0 w-full z-50">
                <div className="flex items-center tracking-wider cursor-pointer" onClick={() => navigate('/admin_dashboard')}>
                    {/* Logo/Brand Name */}
                    <div className="text-white text-xs font-bold flex items-center gap-3 w-24 max-sm:w-10">
                        <img src={logo1} alt="AIO-Globel Logo" />
                    </div>
                    <span className='text-sm font-semibold text-gray-700'>Admin Dashboard</span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex space-x-6">
                    {menuItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => navigate(item.path)}
                            className={`text-sm ${location.pathname === item.path ? 'text-yellow-300 font-semibold underline' : 'text-white'} hover:text-yellow-400`}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                    {/* User Profile */}
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={handleToggleProfile} >
                        <div className="text-white font-semibold max-sm:hidden">{user.name}</div>

                        {/* Profile Image with Hover Effect */}
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

                    {/* User Profile Dropdown */}
                    {toggleProfile && (<AdminProfile onToggle={handleToggleProfile} />)}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setNavbarOpen(!isNavbarOpen)}
                >
                    <MenuOutlined className="text-2xl" />
                </button>
            </header>

            {/* Mobile Navbar */}
            {isNavbarOpen && (
                <nav className="md:hidden bg-blue-800 text-white p-4 space-y-4">
                    {menuItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => navigate(item.path)}
                            className={`w-full text-left text-lg p-2 rounded ${location.pathname === item.path ? 'bg-blue-600 font-semibold' : 'hover:bg-blue-600'}`}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={handleToggleProfile} >
                        <div className="text-white font-semibold max-sm:hidden">{user.name}</div>

                        {/* Profile Image with Hover Effect */}
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

                    {/* User Profile Dropdown */}
                    {toggleProfile && (<AdminProfile onToggle={handleToggleProfile} />)}
                </nav>
            )}
        </div>
    );
};

export default AdminNavbar;

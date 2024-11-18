import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatState } from '../../Context/ChatProvider';
import { Menu, Dropdown } from 'antd';
import { MenuOutlined, LogoutOutlined, UserOutlined, GroupOutlined, RobotOutlined } from '@ant-design/icons';
import AdminNavbar from '../AdminNavbar/AdminNavbar';

const AdminDashboard = () => {
    const { adminLogout } = ChatState() || {};
    const navigate = useNavigate();
    const [isNavbarOpen, setNavbarOpen] = useState(false);

    const handleLogout = () => {
        adminLogout();
        navigate('/');
    };

    const goAutoResponseManagement = () => navigate('/admin/autoResponsesManagement');
    const goGroupManagement = () => navigate('/admin/groupManagement');
    const goUserManagement = () => navigate('/admin/userManagement');

    // Navbar menu items
    const menuItems = [
        { key: '1', label: 'User Management', icon: <UserOutlined />, onClick: goUserManagement },
        { key: '2', label: 'Group Management', icon: <GroupOutlined />, onClick: goGroupManagement },
        { key: '3', label: 'Auto Response Management', icon: <RobotOutlined />, onClick: goAutoResponseManagement },
    ];

    return (
        <div className="relative z-0 min-h-screen bg-gray-50 flex flex-col">
            <div className="relative z-50">
            <AdminNavbar />
            </div>
            
            {/* Main Content Section */}
            <main className="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="col-span-full mb-6">
                    <h2 className="text-2xl font-semibold text-gray-700">Welcome to the Admin Dashboard</h2>
                    <p className="text-gray-600 mt-2">
                        Here, you can manage users, groups, and automated responses to streamline communication.
                    </p>
                </div>

                {/* User Management */}
                <div className="flex flex-col justify-between bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">User Management</h2>
                        <p className="text-gray-600 mb-6">Manage all registered users, roles, and permissions within the platform.</p>
                    </div>
                    <button
                        onClick={goUserManagement}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg w-full text-center transition duration-300"
                    >
                        Manage Users
                    </button>
                </div>

                {/* Group Management */}
                <div className="flex flex-col justify-between bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Group Management</h2>
                        <p className="text-gray-600 mb-6">Organize users into groups and manage group-specific permissions and settings.</p>
                    </div>
                    <button
                        onClick={goGroupManagement}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg w-full text-center transition duration-300"
                    >
                        Manage Groups
                    </button>
                </div>

                {/* Auto-Response Management */}
                <div className="flex flex-col justify-between bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Auto Response Management</h2>
                        <p className="text-gray-600 mb-6">Configure automated responses for efficient communication and engagement.</p>
                    </div>
                    <button
                        onClick={goAutoResponseManagement}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4  rounded-lg w-full text-center transition duration-300"
                    >
                        Manage Responses
                    </button>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;

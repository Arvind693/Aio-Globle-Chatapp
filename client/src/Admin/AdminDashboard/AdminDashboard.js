import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, GroupOutlined, RobotOutlined, MessageOutlined } from '@ant-design/icons';
import AdminNavbar from '../AdminNavbar/AdminNavbar';
import { TypeAnimation } from 'react-type-animation';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const goAutoResponseManagement = () => navigate('/admin/auto-responses-management');
    const goGroupManagement = () => navigate('/admin/group-management');
    const goUserManagement = () => navigate('/admin/user-management');
    const goToChatPlace = () => navigate('/chat');

    return (
        <div className="relative z-0 min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <div className="relative z-50">
                <AdminNavbar />
            </div>

            {/* Main Content Section */}
            <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Welcome Section */}
                <div className="col-span-full mb-4 text-center">
                    <h2
                        className="text-xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-fade-in-up"
                    >
                        Welcome to the Admin Dashboard
                    </h2>
                    <TypeAnimation
                        sequence={[
                            'Manage users, groups, and automated responses seamlessly.',
                            2000,
                            'Streamline communication and enhance productivity.',
                            2000,
                        ]}
                        wrapper="span"
                        speed={40}
                        className="text-lg max-md:text-xs text-gray-700 block"
                        repeat={Infinity}
                    />
                </div>

                {/* Chat Box */}
                <div className="flex flex-col justify-between bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                            Go to Chat Box <MessageOutlined />
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Access and manage user chats and messages efficiently.
                        </p>
                    </div>
                    <button
                        onClick={goToChatPlace}
                        className="bg-red-800 hover:bg-red-900 text-white py-2 px-4 rounded-lg w-full text-center transition duration-300"
                    >
                        <MessageOutlined /> Go to Chat Box
                    </button>
                </div>

                {/* User Management */}
                <div className="flex flex-col justify-between bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                            User Management <UserOutlined />
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Manage registered users, roles, and permissions.
                        </p>
                    </div>
                    <button
                        onClick={goUserManagement}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg w-full text-center transition duration-300"
                    >
                        <UserOutlined /> Manage Users
                    </button>
                </div>

                {/* Group Management */}
                <div className="flex flex-col justify-between bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                            Group Management <GroupOutlined />
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Organize users into groups and manage group-specific settings.
                        </p>
                    </div>
                    <button
                        onClick={goGroupManagement}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg w-full text-center transition duration-300"
                    >
                        <GroupOutlined /> Manage Groups
                    </button>
                </div>

                {/* Auto-Response Management */}
                <div className="flex flex-col justify-between bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                            Auto-Response Management <RobotOutlined />
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Configure automated responses to improve engagement.
                        </p>
                    </div>
                    <button
                        onClick={goAutoResponseManagement}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg w-full text-center transition duration-300"
                    >
                        <RobotOutlined /> Manage Responses
                    </button>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;

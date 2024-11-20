import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import ChatPage from './page/ChatPage';
import './App.css';
import Home from './page/Home';
import AdminDashboard from './Admin/AdminDashboard/AdminDashboard';
import AdminLoginSignUp from './Admin/LoginSignup/AdminLoginSignup';
import LoginSignUp from './components/LoginSignup/LoginSignup';
import AutoResponseManagement from './Admin/AutoResponseManagement/AutoResponseManagement ';
import GroupManagement from './Admin/GroupManagement/GroupManagement';
import UserManagement from './Admin/UserManagement/UserManagement';
import { ChatState } from './Context/ChatProvider';

function App() {
  const { user } = ChatState() || {}; // Ensure ChatState() returns a default value if null/undefined
  const navigate = useNavigate();

  let userInfo = null;
  try {
    if (user) {
      userInfo = user.role === "Admin"
        ? JSON.parse(localStorage.getItem('adminInfo'))
        : JSON.parse(localStorage.getItem('userInfo'));
    }
  } catch (error) {
    console.error("Error parsing user info from localStorage:", error);
  }

  useEffect(() => {
    if (userInfo && window.location.pathname === '/') {
      // Redirect users to their respective dashboards if they land on the homepage
      if (user.role === "Admin") {
        navigate('/admin_dashboard');
      } else {
        navigate('/user/user-dashboard');
      }
    }
  }, [user, userInfo, navigate]);

  return (
    <div className='h-screen w-full'>
      <Routes>
        <Route path='/chat' element={<ChatPage />} />
        <Route path='/' element={<Home />} />
        <Route path='/admin_dashboard' element={<AdminDashboard />} />
        <Route path='/admin-login-signup' element={<AdminLoginSignUp />} />
        <Route path='/user-login-signup' element={<LoginSignUp />} />
        <Route path='/admin/auto-responses-management' element={<AutoResponseManagement />} />
        <Route path='/admin/group-management' element={<GroupManagement />} />
        <Route path='/admin/user-management' element={<UserManagement />} />
        <Route path='/user/user-dashboard' element={<ChatPage />} />
      </Routes>
    </div>
  );
}

export default App;

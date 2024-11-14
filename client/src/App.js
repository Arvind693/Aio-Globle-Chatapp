import React from 'react';
import { Routes, Route } from 'react-router-dom'; // No need for BrowserRouter here, already wrapped in index.js
import ChatPage from './page/ChatPage';
import './App.css';
import HomePage from './page/HomePage';
import Home from './page/Home';
import AdminDashboard from './Admin/AdminDashboard/AdminDashboard';
import AdminLoginSignUp from './Admin/LoginSignup/AdminLoginSignup';
import LoginSignUp from './components/LoginSignup/LoginSignup';
import AutoResponseManagement from './Admin/AutoResponseManagement/AutoResponseManagement ';
import GroupManagement from './Admin/GroupManagement/GroupManagement';
import UserManagement from './Admin/UserManagement/UserManagement';


function App() {
  return (
    <div className='h-screen w-full'>
      <Routes>
        <Route path='/chat' element={<ChatPage />} />
        <Route path='/' element={<Home />} />
        <Route path='/admin_dashboard' element={<AdminDashboard />} />
        <Route path='/admin-login&signup' element={<AdminLoginSignUp />} />
        <Route path='/user-login&signup' element={<LoginSignUp />} />
        <Route path='/admin/autoResponsesManagement' element={<AutoResponseManagement />} />
        <Route path='/admin/groupManagement' element={<GroupManagement/>}/>
        <Route path='/admin/userManagement' element={<UserManagement/>}/>
        <Route path='/user/userdashboard' element={<ChatPage/>}/>
      </Routes>
    </div>
  );
};
export default App;

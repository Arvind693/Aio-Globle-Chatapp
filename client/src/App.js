import React from 'react';
import { Routes, Route } from 'react-router-dom'; // No need for BrowserRouter here, already wrapped in index.js
import ChatPage from './page/ChatPage';
import './App.css';
import HomePage from './page/HomePage';


function App() {
  return (
    <div className='h-screen w-full'>
      <Routes>
        <Route path='/chat' element={<ChatPage />} />
        <Route path='/' element={<HomePage/>} />
      </Routes>
    </div>
  );
}

export default App;

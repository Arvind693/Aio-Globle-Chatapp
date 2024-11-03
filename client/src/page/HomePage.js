import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginSignUp from '../components/LoginSignup/LoginSignup';
import WelcomePage from '../components/WelcomePage/WelcomePage';


const HomePage = () => {
  const navigate = useNavigate();


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));
    if (user) {
      navigate('/chat'); // Redirect to chat if user info is found
    }
  }, [navigate]);


  return (
    <div>
      <LoginSignUp />
    </div>
  );
};

export default HomePage;

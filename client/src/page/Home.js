import React from 'react';
import logo from '../Assets/images/aio-globel2.png';
import { useNavigate } from 'react-router-dom';


const Home = () => {
    const navigate = useNavigate();

    const goAdminDashboard = ()=>{
        navigate('/admin-login-signup')
    }

    const goUserDashboard =()=>{
        navigate('/user-login-signup')
    }

  return (
        <div className="flex w-full flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white">
          {/* Welcome Title */}
          <h1 className="text-4xl max-md:text-xl font-bold mb-4 drop-shadow-lg">
            Welcome to <span className="text-yellow-300">AIO-GLOBEL</span>
          </h1>

          <div className='drop-shadow-lg w-40 max-md:w-20 flex justify-center'>
            <img src={logo} alt="Logo" />
          </div>

          {/* Tagline */}
          <p className="text-lg max-md:text-12px max-md:leading-4 text-center max-w-lg mb-6 drop-shadow-lg">
            Your one-stop global communication hub. Stay connected, collaborate, and chat in real-time with people all over the world. Join the conversation today!
          </p>

          {/* Call to Action */}
          <div className='flex gap-4'>
          <button
            onClick={goAdminDashboard}
            className="px-6 py-2 bg-yellow-300 max-md:px-2 max-md:py-1 max-md:text-12px text-black font-semibold rounded-full hover:bg-yellow-400 transition duration-300">
            Continue As Admin
          </button>
          <button
            onClick={goUserDashboard}
            className="px-6 py-2 bg-yellow-300 max-md:px-2 max-md:py-1 max-md:text-12px text-black font-semibold rounded-full hover:bg-yellow-400 transition duration-300">
            Continue As User
          </button>
          </div>
        </div>
  );
};

export default Home;

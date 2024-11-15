import React, { useState } from 'react';
import axios from 'axios';
import { message, Spin } from 'antd';
import './LoginSignup.css';
import { useNavigate } from 'react-router-dom';
import logo from '../../Assets/images/aio-globel2.png';
import Loader from '../Loader/Loader';

const Login = () => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();

  // Function to validate userName format
  const validateUsername = (username) => {
    const re = /^[a-zA-Z][a-zA-Z0-9_]{2,14}$/;
    return re.test(username);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateUsername(userName)) {
      setLoader(false);
      setError('Please enter a valid userName.');
      message.error('Invalid userName');
      return;
    }

    setLoader(true);

    // Sign In logic
    try {
      const role = "User";
      const response = await axios.post(`/api/user/login`, { userName, password, role });
      if (response.data.success) {
        message.success(response.data.message, 2);
        localStorage.setItem('userInfo', JSON.stringify(response.data.data));
        navigate('/user/userdashboard');
      } else {
        message.error(response.data.message, 2);
      }
    } catch (error) {
      console.error('Error during sign in', error);
      setError('Invalid userName & Password. Please try again.');
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="flex w-full max-md:flex-col max-md:mb-2 items-center justify-center max-md:justify-start  h-screen bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500">
      <div className="flex flex-col items-center justify-center h-full max-md:w-80 max-md:h-auto max-md:mt-5 bg-transparent text-white">
        <h1 className="text-4xl max-md:text-lg font-bold mb-4 max-md:mb-0 drop-shadow-lg">
          Welcome to <span className="text-yellow-300">AIO-GLOBEL</span>
        </h1>

        <div className='drop-shadow-lg w-40 max-md:w-10 flex justify-center'>
          <img src={logo} alt="Logo" />
        </div>

        <p className="text-lg max-md:text-12px max-md:leading-4 text-center max-w-lg mb-6 drop-shadow-lg">
          Your one-stop global communication hub. Stay connected, collaborate, and chat in real-time with people all over the world. Join the conversation today!
        </p>

        <button
          className="px-6 py-2 max-md:hidden max-md:px-2 max-md:py-1 max-md:text-12px max-md:rounded-lg bg-yellow-300 text-black font-semibold rounded-full hover:bg-yellow-400 transition duration-300">
          Get Started With Sign In
        </button>
      </div>  

      <div className="bg-white p-6 max-md:p-2 rounded-lg shadow-2xl w-96 max-md:w-72 max-md:mt-8 max-md:mb-2">
        <h2 className="text-2xl max-md:text-12px border-b border-b-gray-400 font-bold text-center mb-4">
          Sign In
        </h2>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 max-md:space-x-1">
          <div>
            <label htmlFor="userName" className="block text-sm max-md:hidden font-medium text-gray-700">
              userName
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              placeholder='Enter your userName'
              onChange={(e) => setUserName(e.target.value)}
              required
              className="max-md:text-10px max-md:p-1 mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm max-md:hidden font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              placeholder='Enter password'
              onChange={(e) => setPassword(e.target.value)}
              required
              className="max-md:text-10px max-md:p-1 mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              className="max-md:text-10px max-md:p-1 w-full py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-300"
              disabled={loader}
            >
              {loader ? <Spin size='small'/> : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

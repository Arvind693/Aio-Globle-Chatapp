import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import logo from '../../Assets/images/aio-globel2.png'
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const AdminLoginSignUp = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [userName, setuserName] = useState('');          
  const [password, setPassword] = useState('');     
  const [profileImage, setProfileImage] = useState(null); 
  const [error, setError] = useState(null);         
  const [loader, setLoader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const checkUsers = async () => {
      try {
        const response = await axios.get('/api/admin/check-users');
        if (response.data.success) {
          setShowSignUp(response.data.usersExist === false); 
        } else {
          message.error('Error fetching user data.');
        }
      } catch (error) {
        console.error('Error checking users:', error);
        message.error('Failed to fetch user data.');
      }
    };

    checkUsers();
  }, []);

  const validateUsername = (username) => {
    const re = /^[a-zA-Z][a-zA-Z0-9_]{2,14}$/;
    return re.test(username);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);  // Clear any previous errors

    // Check if userName is valid
    if (!validateUsername(userName)) {
      setLoader(false);
      setError('Please enter a valid userName.');
      message.error('Invalid userName');
      return;  // Prevent API call if userName is invalid
    }

    setLoader(true);  // Only show loader after validation

    if (isSignUp) {
      // Sign Up logic
      const formData = new FormData();
      formData.append('name', name);
      formData.append('userName', userName);
      formData.append('password', password);
      if (profileImage) formData.append('profileImage', profileImage);

      try {
        const response = await axios.post('/api/admin/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data.success) {
          message.success(response.data.message);
          // Store user info in localStorage
          localStorage.setItem("adminInfo", JSON.stringify(response.data.data));
          setIsSignUp(false);  // Switch to Sign In after successful registration
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          // Show the error message from the backend
          message.error(error.response.data.message, 4);
        } else {
          // Fallback error if there's no message from the backend
          message.error('Error during sign up, please try again.');
          setError('Error during sign up, please try again.');
        }
      } finally {
        setLoader(false);  // Stop loader after request completes
      }
    } else {

      // Sign In logic
      try {
        const role = "Admin";
        const response = await axios.post(`/api/admin/login`, { userName, password, role });
        if (response.data.success) {
          message.success(response.data.message, 2);
          // Store user info in localStorage
          localStorage.setItem('adminInfo', JSON.stringify(response.data.data));
          navigate('/admin_dashboard'); // Redirect to chat after successful login
        } else {
          message.error(response.data.message, 2);
        }
      } catch (error) {
        console.error('Error during sign in', error);
        setError('Invalid userName & Password. Please try again.');
      } finally {
        setLoader(false);  // Stop loader after request completes
      }
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 overflow-hidden max-md:px-2">

      <div className="flex max-md:flex-col items-center justify-center max-md:justify-start gap-10 max-md:gap-0 h-full max-md:h-auto max-md:mt-1">
        <div className="flex flex-col items-center justify-center h-full max-md:h-auto bg-transparent text-white text-center">
          {/* Welcome Title */}
          <h1 className="text-4xl max-md:text-lg font-bold mb-4 max-md:mb-2 drop-shadow-lg">
            Welcome to <span className="text-yellow-300">AIO-GLOBEL Admin Portal</span>
          </h1>

          <div className="drop-shadow-lg w-40 max-md:w-20 flex justify-center">
            <img src={logo} alt="Logo" />
          </div>

          {/* Tagline */}
          <p className="text-lg max-md:text-xs max-md:leading-5 text-center max-w-lg mb-6 max-md:mb-4 drop-shadow-lg">
            Your central control for managing users, groups, and automated responses. Connect, monitor, and ensure a seamless communication experience across AIO-GLOBEL’s global platform.
          </p>

          {/* Call to Action */}
          <p
            className="px-6 py-2 max-md:hidden max-md:px-2 max-md:py-1 text-sm bg-yellow-300 text-black font-semibold rounded-full hover:bg-yellow-400 transition duration-300"
          >
            Begin Your Admin Session With SignIn/SignUp
          </p>

          {showSignUp && (
            <button
              className="px-6 py-2 max-md:hidden max-md:px-2 max-md:py-1 text-sm bg-yellow-300 text-black font-semibold rounded-full hover:bg-yellow-400 transition duration-300 mt-2"
              onClick={() => setIsSignUp(true)}
            >
              Sign Up as Admin
            </button>
          )}
        </div>

        {/* Login/SignUp form */}
        <div className="bg-white p-6 max-md:p-4 rounded-lg shadow-2xl w-96 max-md:w-72 max-md:mb-2">
          <h2 className="text-2xl max-md:text-lg border-b border-gray-400 font-bold text-center mb-4">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h2>

          {error && <p className="text-red-600 text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4 max-md:space-y-2">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  placeholder="Enter your name"
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-xs max-md:p-2 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            )}

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                placeholder="Enter your username"
                onChange={(e) => setuserName(e.target.value)}
                required
                className="text-xs max-md:p-2 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  placeholder="Create password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-xs max-md:p-2 p-2 block w-full border border-gray-300 rounded-md shadow-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                >
                  {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                </button>
              </div>
            </div>
            {isSignUp && (
              <div>
                <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">
                  Profile Image (optional)
                </label>
                <input
                  type="file"
                  id="profileImage"
                  onChange={(e) => setProfileImage(e.target.files[0])}
                  className="text-xs max-md:p-2 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-300"
                disabled={loader}
              >
                {loader ? (
                  <Spin size="small" />
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>
            </div>

            {/* <div className="text-center mt-4">
              {isSignUp ? (
                <p className="text-xs">
                  Already have an account?{' '}
                  <span className="text-blue-600 cursor-pointer" onClick={() => setIsSignUp(false)}>
                    Sign In
                  </span>
                </p>
              ) : (
                <p className="text-xs">
                  Don’t have an account?{' '}
                  <span className="text-blue-600 cursor-pointer" onClick={() => setIsSignUp(true)}>
                    Sign Up
                  </span>
                </p>

              )}
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );

};
 
export default AdminLoginSignUp;
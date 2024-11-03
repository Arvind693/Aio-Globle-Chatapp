import React, { useState } from 'react';
import axios from 'axios';
import { message, Spin } from 'antd';
import './LoginSignup.css';
import { useNavigate } from 'react-router-dom';
import logo from '../../Assets/images/aio-globel2.png'
import Loader from '../Loader/Loader';

const LoginSignUp = () => {
  const [isSignUp, setIsSignUp] = useState(false);  // Toggle between Sign In and Sign Up
  const [name, setName] = useState('');             // For Sign Up
  const [email, setEmail] = useState('');           // For both Sign In and Sign Up
  const [password, setPassword] = useState('');     // For both Sign In and Sign Up
  const [profileImage, setProfileImage] = useState(null);  // For optional profile image (Sign Up)
  const [error, setError] = useState(null);         // To display any error messages
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();

  // Function to validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);  // Clear any previous errors

    // Check if email is valid
    if (!validateEmail(email)) {
      setLoader(false);
      setError('Please enter a valid email address.');
      message.error('Invalid email address');
      return;  // Prevent API call if email is invalid
    }

    setLoader(true);  // Only show loader after validation

    if (isSignUp) {
      // Sign Up logic
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      if (profileImage) formData.append('profileImage', profileImage);

      try {
        const response = await axios.post('http://localhost:5000/api/user/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data.success) {
          message.success(response.data.message);
          // Store user info in localStorage
          localStorage.setItem("userInfo", JSON.stringify(response.data.data));
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
        const response = await axios.post('http://localhost:5000/api/user/login', { email, password });
        if (response.data.success) {
          message.success(response.data.message, 2);
          // Store user info in localStorage
          localStorage.setItem('userInfo', JSON.stringify(response.data.data));
          navigate('/chat'); // Redirect to chat after successful login
        } else {
          message.error(response.data.message, 2);
        }
      } catch (error) {
        console.error('Error during sign in', error);
        setError('Invalid Email & Password. Please try again.');
      } finally {
        setLoader(false);  // Stop loader after request completes
      }
    }
  };

  return (
    <div className="flex w-full  items-center justify-evenly h-screen bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500">
      <div className="flex  flex-col items-center justify-center h-full bg-transparent text-white l">
        {/* Welcome Title */}
        <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">
          Welcome to <span className="text-yellow-300">AIO-GLOBEL</span>
        </h1>

        <div className='drop-shadow-lg w-40 flex justify-center'>
          <img src={logo} alt="Logo" />
        </div>

        {/* Tagline */}
        <p className="text-lg text-center max-w-lg mb-6 drop-shadow-lg">
          Your one-stop global communication hub. Stay connected, collaborate, and chat in real-time with people all over the world. Join the conversation today!
        </p>

        {/* Call to Action */}
        <button
          className="px-6 py-2 bg-yellow-300 text-black font-semibold rounded-full hover:bg-yellow-400 transition duration-300">
          Get Started With SignIn/SignUp
        </button>
      </div>

      {/* Login SignUp form */}
      <div className="bg-white p-6 rounded-lg shadow-2xl w-96">
        <h2 className="text-2xl font-bold text-center mb-4">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h2>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
            />
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
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-300`}
              disabled={loader}
            >
              {loader ? (
                <Spin size='small'/>
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <span
                  className="text-blue-600 cursor-pointer"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign In
                </span>
              </p>
            ) : (
              <p>
                Don’t have an account?{' '}
                <span
                  className="text-blue-600 cursor-pointer"
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </span>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginSignUp;

import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";

import NotificationAudioPath from "../Assets/Notification-Sound/notification-sound.mp3";

const ChatContext = createContext();

const ENDPOINT =
  process.env.NODE_ENV === "production"
    ? "https://aio-globle-chatapp.onrender.com"
    : "http://localhost:5000";
let socket;

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState([]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audio = React.useRef(new Audio(NotificationAudioPath)); // Use a ref for the audio
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserFromLocalStorage = () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));

        if (adminInfo?.user) {
          setUser(adminInfo.user);
          if (
            location.pathname === "/" ||
            location.pathname === "/admin-login-signup"
          ) {
            navigate("/admin_dashboard");
          }
        } else if (userInfo?.user) {
          setUser(userInfo.user);
          if (
            location.pathname === "/" ||
            location.pathname === "/user-login-signup"
          ) {
            navigate("/user/user-dashboard");
          }
        } else if (location.pathname === "/admin_dashboard") {
          navigate("/admin_login");
        }
      } catch (error) {
        console.error("Error parsing local storage data:", error);
      }
    };

    fetchUserFromLocalStorage();
  }, [location, navigate]);

  useEffect(() => {
    const enableAudio = () => setHasUserInteracted(true);

    window.addEventListener("click", enableAudio);
    window.addEventListener("keydown", enableAudio);

    return () => {
      window.removeEventListener("click", enableAudio);
      window.removeEventListener("keydown", enableAudio);
    };
  }, []);

  useEffect(() => {
    if (!user || !user._id) {
      return;
    }

    if (!socket) {
      socket = io(ENDPOINT);

      const handleNotificationReceived = (savedNotification) => {
        setNotification((prevNotifications) =>
          prevNotifications.some((notif) => notif._id === savedNotification._id)
            ? prevNotifications
            : [...prevNotifications, savedNotification]
        );

        // Play sound only if user has interacted; defer otherwise
        if (hasUserInteracted) {
          playNotificationSound();
        } else {
          console.warn(
            "User has not interacted yet. Sound will be queued until interaction."
          );
          const interactionHandler = () => {
            playNotificationSound();
            window.removeEventListener("click", interactionHandler);
            window.removeEventListener("keydown", interactionHandler);
          };

          window.addEventListener("click", interactionHandler);
          window.addEventListener("keydown", interactionHandler);
        }
      };

      const playNotificationSound = () => {
        audio.current.play().catch((err) =>
          console.error("Audio playback failed:", err)
        );
      };

      socket.on("notification received", handleNotificationReceived);
      socket.emit("setup", user._id);

      return () => {
        socket.off("notification received", handleNotificationReceived);
        socket.disconnect();
        socket = null;
      };
    }
  }, [user, hasUserInteracted]);

  const logout = () => {
    if (socket) {
      socket.emit("logout", { userId: user?._id });
      socket.disconnect();
    }
    localStorage.removeItem("userInfo");
    setChats([]);
    setUser(null);
    setSelectedChat(null);
  };

  const adminLogout = () => {
    if (socket) {
      socket.emit("logout", { userId: user?._id });
      socket.disconnect();
    }
    localStorage.removeItem("adminInfo");
    setChats([]);
    setUser(null);
    setSelectedChat(null);
  };

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        notification,
        setNotification,
        chats,
        setChats,
        adminLogout,
        logout,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;

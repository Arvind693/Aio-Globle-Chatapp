import React, { useEffect, useState } from "react";
import {MdVideoCall } from "react-icons/md";
import { ChatState } from "../../Context/ChatProvider";
import VideoCall from "../VideoCallAndScreenShare/VideoCall";
import ScreenShare from "../VideoCallAndScreenShare/ScreenShare/ScreenShare";

const ChatHeader = ({ socket, handleScreenshot, setUserDetailsModal }) => {
  const { selectedChat, user } = ChatState();
  const [isScreenShareRequested, setIsScreenShareRequested] = useState(false);
  const [isVideoCallStarted, setIsVideoCallStarted] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
  // Extract Other User ID
  useEffect(() => {
    if (!selectedChat.isGroupChat) {
      const otherUser = selectedChat.users.find((u) => u._id !== user._id);
      setOtherUserId(otherUser?._id || null);
    }
  }, [selectedChat, user]);

  // Get Chat Name and Profile Image
  const getChatName = () =>
    selectedChat.isGroupChat
      ? selectedChat.chatName
      : selectedChat.users.find((u) => u._id !== user._id)?.name || "Chat";

  const getProfileImage = () =>
    selectedChat.isGroupChat
      ? selectedChat.groupImage ||
      "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
      : selectedChat.users.find((u) => u._id !== user._id)?.profileImage ||
      "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";

  return (
    <div className="bg-transparent text-white p-4 max-md:p-2 flex items-center justify-between space-x-3 md:space-x-4">
      {/* Profile Section */}
      <div className="flex items-center gap-1">
        <div
          className="h-10 w-10 max-md:h-6 max-md:w-6 rounded-full overflow-hidden cursor-pointer"
          onClick={() => {
            if (user?.role === "Admin") setUserDetailsModal(true);
          }}
        >
          <img
            src={getProfileImage()}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        </div>
        <h3 className="text-lg max-md:text-sm text-black font-semibold truncate">
          {getChatName()}
        </h3>
      </div>
      {/* Screen Share Component */}
      <ScreenShare
        socket={socket}
        isScreenShareRequested={isScreenShareRequested}
        setIsScreenShareRequested={setIsScreenShareRequested}
      />


      {/* Screenshot Button */}
      {/* <button
        onClick={handleScreenshot}
        className="flex items-center bg-gradient-to-r from-blue-600 to-red-400 text-white px-3 py-1 rounded-md hover:bg-blue-700"
      >
        <MdCameraAlt size={20} className="max-md:hidden" />
        <span className="max-md:text-xs">Screenshot</span>
      </button> */}


      {/* Video Call Button */}
      {!selectedChat.isGroupChat && (
        <button
          onClick={() => setIsVideoCallStarted(true)}
          className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
        >
          <MdVideoCall className="text-xl max-md:text-sm" />
        </button>
      )}

      {/* Video Call Component */}
      <VideoCall
        socket={socket}
        isVideoCallStarted={isVideoCallStarted}
        otherUserId={otherUserId}
        setIsVideoCallStarted={setIsVideoCallStarted}
        otherUserName={getChatName()}
        profileImage={getProfileImage()}
      />
    </div>
  );
};

export default ChatHeader;

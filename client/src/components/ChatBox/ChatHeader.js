import React from 'react';
import { MdCameraAlt } from 'react-icons/md';

const ChatHeader = ({ selectedChat, onScreenshot, onToggleScreenShare, isScreenShareOpen, onOpenUserDetails }) => {
  const getChatName = () =>
    selectedChat.isGroupChat
      ? selectedChat.chatName
      : selectedChat.users.find((u) => u._id !== selectedChat.users[0]._id)?.name;

  return (
    <div className="bg-transparent text-white p-4 max-md:p-2 flex items-center justify-between space-x-3 md:space-x-4">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full cursor-pointer" onClick={onOpenUserDetails}>
          <img
            src={selectedChat.groupImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
            alt="Profile"
            className="object-cover h-full w-full"
          />
        </div>
        <h3 className="text-lg text-black font-semibold truncate">{getChatName()}</h3>
      </div>
      <button
        onClick={onToggleScreenShare}
        className="bg-gradient-to-r from-blue-600 to-red-400 text-white px-3 py-1 rounded-md hover:bg-blue-700"
      >
        {isScreenShareOpen ? 'Stop Screen Share' : 'Screen Share'}
      </button>
      <button
        onClick={onScreenshot}
        className="flex bg-gradient-to-r from-blue-600 to-red-400 text-white px-3 py-1 rounded-md hover:bg-blue-700"
      >
        <MdCameraAlt size={20} />
        <span>Screenshot</span>
      </button>
    </div>
  );
};

export default ChatHeader;

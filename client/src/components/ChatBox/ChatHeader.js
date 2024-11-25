import React from 'react';
import { MdCameraAlt } from 'react-icons/md';
import { ChatState } from '../../Context/ChatProvider';

const ChatHeader = ({ handleScreenShare, handleScreenshot, isScreenShareOpen,setUserDetailsModal }) => {
  const {selectedChat,user} = ChatState();

  const getChatName = () => {
    return selectedChat.isGroupChat
      ? selectedChat.chatName
      : selectedChat.users.find((u) => u._id !== user._id)?.name || 'Chat';
  };
  const getProfileImage = () => {
    if (selectedChat.isGroupChat) {
      return selectedChat.groupImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
    }
    const otherUser = selectedChat.users.find((u) => u._id !== user._id);
    return otherUser.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
  };
  return (
    <div className="bg-transparent text-white p-4 max-md:p-2 flex items-center justify-between space-x-3 md:space-x-4">
      <div className='flex justify-center items-center gap-1'>
        <div
          className="h-10 w-10 max-md:h-6 max-md:w-6 rounded-full overflow-hidden cursor-pointer"
          onClick={() => setUserDetailsModal(true)}
        >
          <img src={getProfileImage()} alt="Profile" className="h-full w-full object-cover" />
        </div>
        <h3 className="text-lg max-md:text-10px text-black font-semibold truncate">{getChatName()}</h3>
      </div>
      <button
        onClick={handleScreenShare}
        className="max-md:text-10px bg-gradient-to-r from-blue-600 to-red-400 text-white px-3 py-1 rounded-md hover:bg-blue-700"
      >
        {isScreenShareOpen ? "Stop Screen Share" : "Screen Share"}
      </button>
      <button
        onClick={handleScreenshot}
        className="flex max-md:text-10px bg-gradient-to-r from-blue-600 to-red-400 text-white px-3 py-1 rounded-md hover:bg-blue-700"
      >
        <MdCameraAlt size={20} className='max-md:hidden' /><span>Screenshot</span>
      </button>
    </div>
  );
};

export default ChatHeader;

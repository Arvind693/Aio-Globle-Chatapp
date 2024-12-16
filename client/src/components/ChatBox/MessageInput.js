import React, { useState } from "react";
import { IoIosSend } from "react-icons/io";
import { MdAttachFile } from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs"; 
import EmojiPicker from "emoji-picker-react"; 
import { IoClose } from "react-icons/io5";

const MessageInput = ({
  newMessage,
  setNewMessage,
  handleKeyDown,
  sendMessage,
  setSelectedFile,
}) => {
  const [selectedFile, setSelectedFileLocal] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Emoji picker state

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setSelectedFileLocal(file);
  };

  const truncateFileName = (fileName) =>
    fileName.length > 20 ? `${fileName.substring(0, 20)}...` : fileName;

  const handleEmojiClick = (emojiObject) => {
    // Append the selected emoji to the message input
    setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  return (
    <form
      onSubmit={sendMessage}
      className="p-2 max-md:p-2 bg-transparent flex justify-center max-md:mb-2"
    >
      <div className="h-14 max-md:h-10 flex items-center  max-w-sm md:w-1/2 shadow-lg max-md:mb-6 bg-gray-700 rounded-l-lg">
        <button
          type="button"
          className="p-2 text-gray-400"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <BsEmojiSmile size={window.innerWidth < 640 ? 16 : 25} />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="text-white flex-1 p-2 md:p-3 bg-transparent focus:outline-none shadow-inner text-base max-md:text-12px"
        />
        <label htmlFor="file-upload" className="cursor-pointer bg-transparent text-gray-400 p-2">
          <MdAttachFile size={window.innerWidth < 640 ? 16 : 25} />
        </label>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
      </div>
      <button
        type="submit"
        className="h-14 max-md:h-10 bg-green-600 max-md:text-l text-white px-3 max-md:p-2 rounded-r-lg hover:bg-green-800 shadow-lg"
      >
        <IoIosSend size={window.innerWidth < 640 ? 16 : 25} />
      </button>
      {selectedFile && (
        <div className="fixed bottom-20 text-sm text-gray-500 mt-2">
          <span className="font-semibold text-gray-700">Selected File:</span> {truncateFileName(selectedFile.name)}
        </div>
      )}

    {/* Emoji Picker */}
    {showEmojiPicker && (
        <div
          className="absolute bottom-14 max-md:bottom-2 max-md:top-2 left-4 bg-white shadow-lg rounded-lg p-2 z-50 
               max-w-xs sm:max-w-sm max-md:left-2 max-md:right-2 
               overflow-y-auto border border-gray-300"
        >
          {/* Close Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="text-gray-500 hover:text-red-500"
            >
              <IoClose size={20} />
            </button>
          </div>
          {/* Emoji Picker Component */}
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </form>
  );
};

export default MessageInput;

import React, { useState } from "react";
import { IoIosSend } from "react-icons/io";
import { MdAttachFile } from "react-icons/md";

const MessageInput = ({
  newMessage,
  setNewMessage,
  handleTyping,
  handleKeyDown,
  sendMessage,
  setSelectedFile,
}) => {
  const [selectedFile, setSelectedFileLocal] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setSelectedFileLocal(file);
  };

  const truncateFileName = (fileName) =>
    fileName.length > 20 ? `${fileName.substring(0, 20)}...` : fileName;

  return (
    <form
      onSubmit={sendMessage}
      className="p-4 bg-gray-200 flex items-center rounded-md shadow-lg" 
    >
      <div className="flex items-center rounded-l-lg bg-gray-100">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 p-2 bg-transparent focus:outline-none text-sm text-gray-800"
        />
        <label htmlFor="file-upload" className="cursor-pointer p-2 text-gray-600">
          <MdAttachFile size={25} />
        </label>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <button
        type="submit"
        className="p-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700"
      >
        <IoIosSend size={24} />
      </button>
      {selectedFile && (
        <div className="ml-2 text-sm text-gray-500">
          Selected File: {truncateFileName(selectedFile.name)}
        </div>
      )}
    </form>
  );
};

export default MessageInput;

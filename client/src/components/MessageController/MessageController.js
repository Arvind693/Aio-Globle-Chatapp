// components/MessageController.js

import React from 'react';
import { FaTrash } from 'react-icons/fa'; // Icon for delete
import './MessageController.css'; // Import CSS for styling

const MessageController = ({ messages, onDeleteMessage, user }) => {
  return (
    <div className="message-container">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.sender._id === user._id ? 'sent' : 'received'}`}
        >
          <p>{msg.content}</p>
          {msg.sender._id === user._id && (
            <button
              className="delete-button"
              onClick={() => onDeleteMessage(msg._id)}
              aria-label="Delete message"
            >
              <FaTrash />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageController;

import React from 'react';
import './ChatTypingLoader.css'; // For styling the loader

const ChatTypingLoader = () => {
    return (
        <div className="chat-typing-loader">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
        </div>
    );
};

export default ChatTypingLoader;

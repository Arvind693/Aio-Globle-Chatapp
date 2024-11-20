import React, { useEffect, useRef } from 'react';
import { FaTrash } from 'react-icons/fa';
import SendingMessageAnimation from '../Animations/SendingMessageAnimation';
import ChatTypingLoader from '../ChatTypingLoader/ChatTypingLoader';
import { ChatState } from '../../Context/ChatProvider';
import { Spin } from 'antd';

const MessageList = ({
    messages,
    user,
    isTyping,
    hoveredMessage,
    setHoveredMessage,
    handleDeleteMessage,
    handleImageClick,
    loading,
}) => {
    const { selectedChat } = ChatState();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [selectedChat, messages]);

    const formatDate = (dateString) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (dateString) => {
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        return new Date(dateString).toLocaleTimeString(undefined, options);
    };

    return (
        <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-transparent h-full mb-2 md:mb-5 pb-10">
            {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                    <div><Spin className='custom-spin' style={{ color: '#1890ff', fontSize: '32px' }} /></div>
                </div>
            ) : messages.length === 0 ? (
                <p className=" text-center text-gray-500">No messages yet.</p>
            ) : (
                <>
                    {messages.map((msg, index) => {
                        const isNewDay =
                            index === 0 || formatDate(msg.createdAt) !== formatDate(messages[index - 1]?.createdAt);

                        return (
                            <div key={msg._id || msg.tempId}>
                                {isNewDay && (
                                    <div className="text-center my-1 md:my-2 text-gray-500 text-xs md:text-sm">
                                        {formatDate(msg.createdAt)}
                                    </div>
                                )}
                                <div
                                    className={`mb-2 md:mb-4 flex  ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'
                                        }`}
                                >
                                    <div
                                        onMouseEnter={() => setHoveredMessage(msg._id)}
                                        onMouseLeave={() => setHoveredMessage(null)}
                                        className={`relative max-w-[80%] md:max-w-xs p-2 rounded-lg shadow-md ${msg.sender._id === user._id
                                            ? msg.content
                                                ? 'bg-green-600 text-white'
                                                : 'bg-transparent border-2 border-green-500'
                                            : msg.content
                                                ? 'bg-gray-400 text-black'
                                                : 'bg-transparent border-2 border-gray-400'
                                            }`}
                                    >
                                        {msg.content && (
                                            <p className="break-words text-sm max-md:text-10px">{msg.content}</p>
                                        )}
                                        {msg.file && (
                                            <div className="mt-2">
                                                {msg.file.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                                    <img
                                                        src={msg.file}
                                                        alt="Sent file"
                                                        onClick={() => handleImageClick(msg.file)}
                                                        className="max-w-full max-h-40 max-md:w-20 rounded-lg cursor-pointer"
                                                    />
                                                ) : (
                                                    <a
                                                        href={msg.file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 font-semibold underline text-sm max-md:text-10px"
                                                    >
                                                        View File
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center gap-1 mt-1 max-md:mt-0">
                                            <p className="text-xs max-md:text-6px text-gray-700">
                                                {formatTime(msg.createdAt)}
                                            </p>
                                            {msg.sender._id === user._id && (
                                                <div className="flex items-center gap-1">
                                                    <p className="max-md:text-8px">
                                                        {msg.isTemporary ? (
                                                            <span className="text-yellow-600 font-semibold text-sm max-md:text-8px">
                                                                <SendingMessageAnimation />
                                                            </span>
                                                        ) : msg.seen ? (
                                                            <span className="text-gray-700 text-xs max-md:text-8px">
                                                                Seen
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm max-md:text-8px text-gray-700">
                                                                Sent
                                                            </span>
                                                        )}
                                                    </p>
                                                    {hoveredMessage === msg._id && (
                                                        <FaTrash
                                                            className="absolute top-0 right-0 text-red-800 cursor-pointer"
                                                            onClick={() => handleDeleteMessage(msg._id)}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {isTyping && <ChatTypingLoader />}
                    <div ref={messagesEndRef} />
                </>
            )}
        </div>
    );
};

export default MessageList;

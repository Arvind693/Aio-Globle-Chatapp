import React, { useEffect, useRef, useState } from 'react';
import { FaPlay, FaTrash } from 'react-icons/fa';
import SendingMessageAnimation from '../Animations/SendingMessageAnimation';
import ChatTypingLoader from '../ChatTypingLoader/ChatTypingLoader';
import { ChatState } from '../../Context/ChatProvider';
import { Spin } from 'antd';
import ImageModal from '../Animations/ImageModal';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';

const MessageList = ({ messages, isTyping, hoveredMessage, setHoveredMessage, handleDeleteMessage, loading }) => {
    const { user, selectedChat } = ChatState();
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const messagesEndRef = useRef(null);

    const chatId = selectedChat ? selectedChat._id : null;

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

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setIsImageModalOpen(true);
    };
    const closeImageModal = () => {
        setIsImageModalOpen(false);
    };
    return (
        <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-transparent h-full mb-2 md:mb-5 pb-10">
            {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                    <div><Spin className='custom-spin' style={{ color: '#1890ff', fontSize: '32px' }} /></div>
                </div>
            ) : !messages[chatId] || messages[chatId].length === 0 ? (
                <p className=" text-center text-gray-500">No messages yet.</p>
            ) : (
                <>
                    {messages[chatId].map((msg, index) => {
                        const isNewDay =
                            index === 0 || formatDate(msg.createdAt) !== formatDate(messages[chatId][index - 1]?.createdAt);
                        const isGroupChat = selectedChat?.isGroupChat;
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
                                        {/* Show sender's name in group chat for messages not sent by the current user */}
                                        {isGroupChat && msg.sender._id !== user._id && (
                                            <p className="text-8px text-blue-700 font-semibold mb-1">
                                                {msg.sender.name}
                                            </p>
                                        )}
                                        {msg.content && (
                                            <p className="break-words text-sm max-md:text-xs">
                                                {msg.content.split(/([\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base})/gu).map((char, index) => (
                                                    <span
                                                        key={index}
                                                        className={/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}/gu.test(char) ? "text-xl max-md:text-sm" : ""}
                                                        style={/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}/gu.test(char) ? { border: 'none', outline: 'none' } : {}}
                                                    >
                                                        {char}
                                                    </span>
                                                ))}
                                            </p>
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
                                                ) : msg.file.match(/\.(mp4|mkv|avi)$/i) ? (
                                                    <div>
                                                        <VideoPlayer src={msg.file}  thumbnail={msg.file.replace('/upload/', '/upload/so_5/').replace(/\.[^/.]+$/, '.jpg')}/>
                                                    </div>
                                                ) : msg.file.match(/\.(mp3|wav|ogg|mpeg)$/i) ? (
                                                    <div>
                                                        <AudioPlayer src={msg.file} />
                                                        <button
                                                            className="flex items-center gap-2 text-blue-500 font-semibold underline text-sm max-md:text-10px"
                                                            onClick={() => window.open(msg.file, '_blank')}
                                                        >
                                                            Download
                                                        </button>
                                                    </div>
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
            {isImageModalOpen && <ImageModal imageUrl={selectedImage} onClose={closeImageModal} />}
        </div>
    );
};

export default MessageList;

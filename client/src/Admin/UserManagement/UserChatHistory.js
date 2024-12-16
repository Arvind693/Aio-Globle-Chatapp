import React, { useEffect, useState } from 'react';
import { Modal, Spin, List } from 'antd';
import axios from 'axios';

const UserChatHistory = ({ visible, onClose, userId }) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && userId) {
            fetchChatHistory();
        }
    }, [visible, userId]);

    const fetchChatHistory = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/chat/fetch-chat-history/${userId}`);

            if (response.data.success) {
                // Extract chats and messages from the response
                const { chats, messages } = response.data.data;
                console.log("Fetched Chats:", chats);
                console.log("Fetched Messages:", messages);

                // Transform messages and group them by chat
                const formattedChats = chats.map(chat => {
                    // Filter messages related to the current chat
                    const chatMessages = messages.filter(message => message.chat._id === chat._id);

                    // Map messages to a format suitable for rendering
                    const formattedMessages = chatMessages.map(message => ({
                        sender: message.sender?.name || "Unknown",
                        content: message.content || "No content",
                        timestamp: message.createdAt,
                    }));

                    return {
                        chatName: chat.chatName || "Private Chat",
                        messages: formattedMessages,
                        chatId: chat._id,
                        updatedAt: chat.updatedAt,
                    };
                });

                setChatHistory(formattedChats);
            } else {
                console.error('Error:', response.data.message);
                setChatHistory([]);
            }
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
            setChatHistory([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Chat History"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
        >
            {loading ? (
                <div className="flex justify-center items-center">
                    <Spin size={window.innerWidth < 640 ? 16 : 20} />
                </div>
            ) : chatHistory.length > 0 ? (
                <List
                    itemLayout="horizontal"
                    dataSource={chatHistory}
                    renderItem={(chat) => (
                        <List.Item>
                            <List.Item.Meta
                                title={
                                    <span className="font-semibold">
                                        {chat.chatName === "Private Chat" ? (
                                            "Private Chat"
                                        ) : (
                                            <span>Group Chat:<span className='text-12px text-blue-600'> {chat.chatName}</span></span>
                                        )}
                                    </span>
                                }
                                description={
                                    <div>
                                        {/* Check if there are no messages in the chat */}
                                        {chat.messages.length === 0 ? (
                                            <p className="text-gray-500">This chat has no messages yet.</p>
                                        ) : (
                                            chat.messages.map((msg, idx) => (
                                                <div key={idx} className="mb-2">
                                                    <span className="font-semibold">{msg.sender}: </span>
                                                    <span>{msg.content}</span>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(msg.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                }
                            />
                            <div className="text-gray-500 text-xs">{new Date(chat.updatedAt).toLocaleString()}</div>
                        </List.Item>
                    )}
                />
            ) : (
                <p className="text-center text-gray-500">No chat history available.</p>
            )}
        </Modal>
    );
};

export default UserChatHistory;

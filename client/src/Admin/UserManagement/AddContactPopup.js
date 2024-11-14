// AddContactPopup.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, Input, List, Avatar, message } from 'antd';
import { ChatState } from '../../Context/ChatProvider';

const AddContactPopup = ({ visible, onClose, userId, onContactAdded }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [error,setError] = useState('');
    const [loading,setLoading] = useState(false);
    const {chats,setChats, setSelectedChat} = ChatState();
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));


    // Search user functionality
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchTerm) {
                setSearchResults([]);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${adminInfo.token}`,
                    },
                };

                const { data } = await axios.get(`/api/admin/search?q=${searchTerm}`, config);

                setSearchResults(data.data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError('Failed to fetch users. Please try again later.');
                console.error('Error fetching users:', err);
            }
        };

        searchUsers();
    }, [searchTerm]);

    const handleAddContact = async (contactId) => {
        try {
            const response = await axios.put(`/api/admin/${userId}/contacts`, {
                contactId,
            });
    
            if (response.status === 200) {
                message.success('Contact added successfully');
                onContactAdded();
                onClose(); 
            }
        } catch (error) {
            console.error('Error adding contact:', error);
            message.error('Failed to add contact.');
        }
    };

    // create a chat 
    const accessChat = async (userId) => {
        try {
          const config = {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminInfo.token}`,
            },
          };
    
          const { data } = await axios.post(`/api/chat`, { userId }, config);
          const chat = data.data;
    
          if (!chats.find((c) => c._id === chat._id)) {
            setChats([chat, ...chats]);
          }
          setSelectedChat(chat);
        } catch (error) {
          console.error('Error accessing chat:', error);
        }
      };

    return (
        <Modal
            title="Add Allowed Contact"
            open={visible}
            onCancel={onClose}
            footer={null}
        >
            <Input
                type="text"
                placeholder="Search user by name or username"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 rounded-md border w-full"
            />
            <List
                dataSource={searchResults}
                renderItem={(user) => (
                    <List.Item
                        onClick={() => handleAddContact(user._id)}
                        className="cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
                    >
                        <List.Item.Meta
                            avatar={<Avatar src={user.profileImage} />}
                            title={user.name}
                            description={`Username: ${user.userName}`}
                        />
                    </List.Item>
                )}
            />
        </Modal>
    );
};

export default AddContactPopup;

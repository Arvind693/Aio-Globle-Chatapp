import React, { useEffect, useState } from 'react';
import { ChatState } from '../Context/ChatProvider';
import axios from 'axios';
import { message } from 'antd';
import Loader from './Loader/Loader';
import GroupChatModal from './GroupChatModel/GroupChatModel';

// Helper function to get the sender name in one-on-one chats
const getSender = (loggedUser, users) => {
  return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
};

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { user, selectedChat, setSelectedChat, chats, setChats } = ChatState();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get('http://localhost:5000/api/chat', config);
      setChats(data);
      console.log(chats);
    } catch (error) {
      message.error('Failed to load the chats');
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem('userInfo')));
    fetchChats();
  }, [fetchAgain]);

  return (
    <div
      style={{
        display: selectedChat ? 'none' : 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: 'white',
        width: '100%',
        maxWidth: '31%',
        borderRadius: '8px',
        border: '1px solid lightgray',
      }}
    >
      <div
        style={{
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          fontSize: '28px',
          fontFamily: 'Work sans',
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        My Chats
        <GroupChatModal>
          <button
            style={{
              display: 'flex',
              fontSize: '17px',
              padding: '8px 16px',
              backgroundColor: '#38B2AC',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            New Group Chat +
          </button>
        </GroupChatModal>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          backgroundColor: '#F8F8F8',
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflowY: 'hidden',
        }}
      >
        {chats ? (
          <div style={{ overflowY: 'scroll' }}>
            {chats.map((chat) => (
              <div
                onClick={() => setSelectedChat(chat)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedChat === chat ? '#38B2AC' : '#E8E8E8',
                  color: selectedChat === chat ? 'white' : 'black',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                }}
                key={chat._id}
              >
                <div>
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
                </div>
                {chat.latestMessage && (
                  <div style={{ fontSize: '12px' }}>
                    <b>{chat.latestMessage.sender.name} : </b>
                    {chat.latestMessage.content.length > 50
                      ? chat.latestMessage.content.substring(0, 51) + '...'
                      : chat.latestMessage.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Loader />
        )}
      </div>
    </div>
  );
};

export default MyChats;

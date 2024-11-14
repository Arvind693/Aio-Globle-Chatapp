// AutoResponseSidebar.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiX } from 'react-icons/fi';
import { Spin } from 'antd';

const AutoResponseSidebar = ({ isOpen, onClose }) => {
  const [responses, setResponses] = useState([]);
  const [conversation, setConversation] = useState([]);
  const conversationEndRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      const fetchResponses = async () => {
        try {
          const { data } = await axios.get('/api/auto-responses');
          setResponses(data.data);
          setLoading(false);
        } catch (error) {
          setLoading(false);
          console.error('Error fetching auto-responses:', error);
        }
      };
      fetchResponses();
    }
  }, [isOpen]);

  const handleTriggerClick = (response) => {
    setConversation((prev) => [
      ...prev,
      { type: 'user', message: response.trigger, timestamp: new Date() },
      { type: 'assistant', message: response.response, timestamp: new Date() },
    ]);
  };

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  return (
    <div className={`fixed z-50 right-0 top-0 h-full bg-gray-50 shadow-lg transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 w-full flex flex-col`}>
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-gradient-to-r from-green-600 via-pink-400 to-purple-600  text-white border-b">
        <h2 className="text-lg font-semibold">Instant Assistant</h2>
        <button onClick={onClose} className="text-white">
          <FiX size={24} />
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Trigger List */}
        {loading ? 
         <div className='w-1/3'>
           <div className='w-full h-9 bg-gray-300 mt-4 '></div>
           <div className='w-full h-9 bg-gray-300 mt-4 '></div>
           <div className='w-full h-9 bg-gray-300 mt-4 '></div>
           <div className='w-full h-9 bg-gray-300 mt-4 '></div>
           <div className='w-full h-9 bg-gray-300 mt-4 '></div>
         </div>
          :
          <div className="w-1/3 bg-gray-100 p-4 overflow-y-auto border-r">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">Queries</h3>
            {responses.map((response) => (
              <button
                key={response._id}
                className="w-full text-left mb-2 p-2 bg-white shadow rounded-lg hover:bg-blue-200"
                onClick={() => handleTriggerClick(response)}
              >
                {response.trigger}
              </button>
            ))}
          </div>
        }

        {/* Conversation Display */}
        <div className="w-2/3 p-4 flex flex-col justify-between bg-white">
          <div className="flex-grow overflow-y-auto mb-4 pr-2">
            {conversation.length > 0 ? (
              conversation.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-start' : 'justify-end'} mb-3`}>
                  <div className={`${msg.type === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'} p-3 rounded-lg shadow max-w-xs`}>
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">Select a trigger to start the chat.</p>
            )}
            <div ref={conversationEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoResponseSidebar;

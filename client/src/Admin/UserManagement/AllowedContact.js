import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RiDeleteBin5Fill } from "react-icons/ri";

const AllowedContact = ({ userId, contactId, onRemove }) => {
    const [contact, setContact] = useState(null);
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));

    useEffect(() => {
        // Fetch contact details by ID
        const fetchContact = async () => {
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${adminInfo?.token}`,
                    },
                };

                // Fetch user data from the backend
                const response = await axios.get(`/api/admin/getuser/${contactId}`, config);
                setContact(response.data); // Assuming response.data is the contact object
            } catch (error) {
                console.error('Error fetching contact details:', error);
            }
        };
        fetchContact();
    }, [contactId, adminInfo]);

    if (!contact) return null; // Render nothing if contact data is not yet loaded

    return (
        <div className="flex items-center bg-gray-300 p-2 rounded mb-1">
            <span className="text-10px font-medium text-gray-700">{contact.name}</span>
            <button
                onClick={() => onRemove(userId, contact._id)} // Pass userId and contactId to onRemove
                className="ml-2 text-red-500 hover:text-red-700"
            >
                <RiDeleteBin5Fill size={18} className='text-red-700'/>
            </button>
        </div>
    );
};

export default AllowedContact;

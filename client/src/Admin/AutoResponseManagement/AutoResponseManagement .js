import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { message, Spin } from 'antd';
import AdminNavbar from '../AdminNavbar/AdminNavbar';
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";

const AutoResponseManagement = () => {
    const [autoResponses, setAutoResponses] = useState([]);
    const [formData, setFormData] = useState({ trigger: '', response: '' });
    const [editingId, setEditingId] = useState(null);
    const [loading,setLoading] = useState(false);

    useEffect(() => {
        fetchAutoResponses();
    }, []);

    const fetchAutoResponses = async () => {
        try {
            const response = await axios.get('/api/admin/autoresponses');
            setAutoResponses(response.data.autoResponses);
        } catch (error) {
            console.error('Error fetching auto-responses:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (editingId) {
            try {
                await axios.put(`/api/admin/autoresponses/${editingId}`, formData);
                message.success('Auto-response updated successfully', 2);
                setFormData({ trigger: '', response: '' });
                setEditingId(null);
                fetchAutoResponses();
                setLoading(false);
            } catch (error) {
                setLoading(false);
                console.error('Error updating auto-response:', error);
                message.error('Failed to update auto-response. Please try again.', 2);
            }
        } else {
            try {
                await axios.post('/api/admin/autoresponses', formData);
                message.success('Auto-response added successfully', 2);
                setFormData({ trigger: '', response: '' });
                fetchAutoResponses();
                setLoading(false);
            } catch (error) {
                console.error('Error adding auto-response:', error);
                message.error('Failed to add auto-response. Please try again.');
                setLoading(false);
            }
        }
    };

    const handleEdit = (autoResponse) => {
        setFormData({ trigger: autoResponse.trigger, response: autoResponse.response });
        setEditingId(autoResponse._id);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/admin/autoresponses/${id}`);
            message.success('Auto-response deleted successfully', 2);
            fetchAutoResponses();
        } catch (error) {
            console.error('Error deleting auto-response:', error);
            message.error('Failed to delete auto-response. Please try again.', 2);
        }
    };

    return (
        <div className=" w-full">
            <div>
                <AdminNavbar />
            </div>
            <div className='max-w-3xl mx-auto  rounded-lg  mt-4 flex flex-col  items-center'>
                <form onSubmit={handleSubmit} className="space-y-4 mb-6 bg-gray-200 p-4 rounded shadow max-md:w-72">
                    <input
                        type="text"
                        name="trigger"
                        placeholder="Trigger Keyword"
                        value={formData.trigger}
                        onChange={handleChange}
                        required
                        className="w-full max-md:text-xs p-2 border-2 border-green-500 rounded focus:outline-none"
                    />
                    <input
                        type="text"
                        name="response"
                        placeholder="Auto Response"
                        value={formData.response}
                        onChange={handleChange}
                        required
                        className="w-full max-md:text-xs p-2 border-2 border-green-500 rounded focus:outline-none"
                    />
                    <div className="flex items-center space-x-4">
                        <button type="submit" className="px-4 py-2 max-md:text-xs bg-gradient-to-t from-green-500 to-green-600 bg-blue-600 text-white rounded hover:bg-blue-700">
                            {loading? <Spin size='small'/> : editingId ? 'Update' : 'Add'} Auto Response
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ trigger: '', response: '' });
                                }}
                                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div className="bg-gray-200 p-4 rounded shadow max-md:w-72">
                    <h4 className="text-xl max-md:text-xs font-semibold text-gray-700 mb-3">Existing Auto Responses</h4>
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="w-full border-b text-left">
                                <th className="py-2 px-4 max-md:text-10px">Trigger</th>
                                <th className="py-2 px-4 max-md:text-10px">Response</th>
                                <th className="py-2 px-4 max-md:text-10px">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {autoResponses.map((ar) => (
                                <tr key={ar._id} className="border-b hover:bg-gray-100">
                                    <td className="py-2 px-4 max-md:text-8px">{ar.trigger}</td>
                                    <td className="py-2 px-4 max-md:text-8px">{ar.response}</td>
                                    <td className="py-2 px-4 space-x-2">
                                        <button
                                            onClick={() => handleEdit(ar)}
                                            className="px-3 py-1 text-blue-600 border rounded hover:bg-blue-50"
                                        >
                                            <CiEdit className='text-lg max-md:text-xs text-green-500'/>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ar._id)}
                                            className="px-3 py-1 text-red-600 border rounded hover:bg-red-50"
                                        >
                                           <MdDelete className='text-lg max-md:text-xs text-red-700'/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AutoResponseManagement;
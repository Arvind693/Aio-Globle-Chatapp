import React, { useState, useRef } from 'react';
import { Modal } from 'antd';
import { FaPlay } from 'react-icons/fa';

const VideoPlayer = ({ src, thumbnail }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const videoRef = useRef(null);

    const openModal = () => {
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        if (videoRef.current) {
            videoRef.current.pause(); // Pause the video when the modal closes
        }
    };

    return (
        <div className="video-player relative">
            {/* Video Thumbnail with Play Button */}
            <div
                className="relative cursor-pointer rounded-lg max-w-full max-h-40 object-cover overflow-hidden"
                onClick={openModal}
            >
                <img
                    src={thumbnail || '/default-thumbnail.png'} // Default thumbnail if none is provided
                    alt="Video Thumbnail"
                    onClick={openModal}
                    className="cursor-pointer rounded-lg max-w-full max-h-40  object-cover"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <FaPlay className="text-white text-2xl max-md:text-xl" />
                </div>
            </div>

            {/* Ant Design Modal */}
            <Modal
                open={isModalVisible}
                footer={null}
                onCancel={closeModal}
                centered
                width="100vw"
                style={{ top: 0 }}
                styles={{ body: {padding: 0, height: '100vh', overflow: 'hidden'} }}
            >
                <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%' }}
                    controls
                    autoPlay
                >
                    <source src={src} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </Modal>
        </div>
    );
};

export default VideoPlayer;

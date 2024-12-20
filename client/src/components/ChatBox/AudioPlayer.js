import React, { useState } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

const AudioPlayer = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio] = useState(new Audio(src));

    const togglePlayPause = () => {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying); 
    };

    // Pause audio when component unmounts
    React.useEffect(() => {
        // Add event listener for when the audio ends
        audio.onended = () => {
            setIsPlaying(false); // Update the state to 'paused'
        };

        // Cleanup on unmount
        return () => {
            audio.pause();
            audio.onended = null; // Remove event listener
        };
    }, [audio]);

    return (
        <div className="audio-player flex items-center gap-2">
            <button
                onClick={togglePlayPause}
                className="text-blue-500 hover:text-blue-700 text-lg focus:outline-none"
            >
                {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <span className="text-sm text-gray-700">{isPlaying ? 'Playing' : 'Paused'}</span>
        </div>
    );
};

export default AudioPlayer;

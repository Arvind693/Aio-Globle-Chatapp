import React, { useEffect, useState } from "react";

const ScreenShare = ({ socket, isScreenShareOpen, setIsScreenShareOpen }) => {
  const [screenStream, setScreenStream] = useState(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => stopScreenSharing();
  }, []);

  const startScreenSharing = async () => {
    try {
      // Request screen media from the user
      const screenMedia = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setScreenStream(screenMedia);
      // Emit event to the socket when sharing starts
      socket.emit("start screen share", { userId: socket.id, stream: screenMedia });
      
      // Handle screen stop event
      screenMedia.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  };
 
  const stopScreenSharing = () => {
    if (screenStream) {
      // Stop all media tracks
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      socket.emit("stop screen share", { userId: socket.id });
    }
  };

  return (
    <div>
      {isScreenShareOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col space-y-3">
            <h2 className="text-lg font-semibold">Screen Sharing</h2>
            <div className="flex space-x-3">
              <button
                onClick={startScreenSharing}
                className="px-4 py-2 bg-green-600 text-white rounded-md"
                disabled={!!screenStream}
              >
                Start Sharing
              </button>
              <button
                onClick={stopScreenSharing}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
                disabled={!screenStream}
              >
                Stop Sharing
              </button>
            </div>
            <button
              onClick={() => setIsScreenShareOpen(false)}
              className="mt-3 px-4 py-2 bg-gray-600 text-white rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenShare;

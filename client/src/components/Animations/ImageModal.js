import React from 'react';

const ImageModal = ({ imageUrl, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-screen max-h-screen flex justify-center items-center"
        onClick={(e) => e.stopPropagation()} // Prevent modal close on image click
      >
        <img
          src={imageUrl}
          alt="Enlarged"
          className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-lg"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white text-3xl bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-all"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default ImageModal;

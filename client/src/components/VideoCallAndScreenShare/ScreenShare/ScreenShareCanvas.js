import React, { useRef, useEffect } from "react";

// Canvas Component for Drawing and Annotations
const ScreenShareCanvas = ({ stream }) => {
    const canvasRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        console.log("Canvas running...")
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        const video = document.createElement("video");
        videoRef.current = video;
        video.srcObject = stream;
        video.play();

        // Set canvas dimensions to match the video stream
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw the video stream onto the canvas
            drawStreamToCanvas();
        };

        const drawStreamToCanvas = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Animation loop for continuous rendering
            requestAnimationFrame(drawStreamToCanvas);
        };

        return () => {
            console.log("Canvas return running...")
            video.pause();
            video.srcObject = null;
        };
    }, [stream]);

    // Expose a method to allow annotations or drawings on the canvas
    const drawAnnotation = (x, y, color = "red", size = 5) => {
        const context = canvasRef.current.getContext("2d");
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    };

    return (
        <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", border: "1px solid black" }}
            onMouseDown={(e) => {
                // Example interaction: Draw a dot where the user clicks
                const rect = e.target.getBoundingClientRect();
                drawAnnotation(e.clientX - rect.left, e.clientY - rect.top);
            }}
        ></canvas>
    );
};

export default ScreenShareCanvas;

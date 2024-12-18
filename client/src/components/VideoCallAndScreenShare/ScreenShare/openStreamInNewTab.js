export const openStreamInNewTab = (stream, stopScreenAccessForBoth) => {
    const newTabRef = window.open("", "_blank", `width=${window.screen.width},height=${window.screen.height}`);

    // Create the video element
    const video = newTabRef.document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.autoplay = true;
    video.controls = true;
    video.style.width = "100%";
    video.style.height = "100%";

    // Create the Stop button
    const stopButton = newTabRef.document.createElement("button");
    stopButton.textContent = "Stop";
    stopButton.style = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border: 1px solid #f87171;
        background-color: red;
        color: #f87171;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
    `;
    stopButton.onmouseover = () => {
        stopButton.style.backgroundColor = "#fee2e2";
    };
    stopButton.onmouseout = () => {
        stopButton.style.backgroundColor = "transparent";
    };

    // Stop button onclick handler
    stopButton.onclick = () => {
        stopScreenAccessForBoth();  // Call the passed stop function
        newTabRef.close();  // Close the new tab
    };

    // Append the elements to the new tab's body
    const body = newTabRef.document.body;
    body.style.margin = "0";
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.justifyContent = "center";
    body.style.alignItems = "center";
    body.style.height = "100vh";
    body.style.backgroundColor = "#000";

    body.appendChild(video);
    body.appendChild(stopButton);

    // Handle autoplay issues gracefully
    video.addEventListener("loadedmetadata", () => {
        video.play().catch((error) => {
            console.warn("Autoplay failed:", error);
            const playButton = newTabRef.document.createElement("button");
            playButton.textContent = "Click to Play";
            playButton.style = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 10px 20px;
                background-color: #2563eb;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            `;
            playButton.onclick = () => {
                video.play();
                playButton.remove();
            };
            body.appendChild(playButton);
        });
    });
};

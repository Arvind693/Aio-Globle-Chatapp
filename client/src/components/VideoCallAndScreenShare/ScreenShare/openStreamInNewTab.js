export const openStreamInNewTab = (stream, stopScreenAccessForBoth, localStreamRef) => {
    const newTabRef = window.open("", "_blank", `width=${window.screen.width},height=${window.screen.height}`);

    // Create the video element
    const video = newTabRef.document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.autoplay = true;
    video.controls = true;
    video.style.width = "100%";
    video.style.height = "100%";

    // Create a container for the buttons
    const buttonContainer = newTabRef.document.createElement("div");
    buttonContainer.style = `
        display: flex;
        justify-content: center;
        gap: 20px;
        position: absolute;
        bottom: 20px;
        width: 100%;
    `;

    // Create the Stop button
    const stopButton = newTabRef.document.createElement("button");
    stopButton.textContent = "Stop";
    stopButton.style = `
        padding: 10px 20px;
        border: 1px solid #f87171;
        background-color: red;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
    `;
    stopButton.onclick = () => {
        stopScreenAccessForBoth();
        newTabRef.close();
    };

    // Create the Mute/Unmute button
    const audioButton = newTabRef.document.createElement("button");
    audioButton.textContent = "Mute"; // Default text
    audioButton.style = `
        padding: 10px 20px;
        border: 1px solid #2563eb;
        background-color: #2563eb;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
    `;
    audioButton.onclick = () => {
        if (localStreamRef?.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                audioButton.textContent = audioTrack.enabled ? "Mute" : "Unmute"; // Update button text
            } else {
                console.error("No audio track found to toggle.");
            }
        } else {
            console.error("Local stream is not initialized.");
        }
    };

    // Append buttons to the container
    buttonContainer.appendChild(stopButton);
    buttonContainer.appendChild(audioButton);

    // Append elements to the new tab's body
    const body = newTabRef.document.body;
    body.style.margin = "0";
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.justifyContent = "center";
    body.style.alignItems = "center";
    body.style.height = "100vh";
    body.style.backgroundColor = "#000";

    body.appendChild(video);
    body.appendChild(buttonContainer);

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

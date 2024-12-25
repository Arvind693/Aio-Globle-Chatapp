import React, { useEffect, useState, useRef } from "react";
import { MdMic, MdMicOff } from "react-icons/md";
import { ChatState } from "../../../Context/ChatProvider";
import Peer from "simple-peer";
import peerConfig from "../peerConfig";
import { message } from "antd";
import { useGlobalPopup } from "../../../Context/GlobalPopupProvider";
import { openStreamInNewTab } from "./openStreamInNewTab";

const ScreenShare = ({ socket, isScreenShareRequested, setIsScreenShareRequested }) => {
    const { selectedChat, user } = ChatState();
    const { showPopup, hidePopup } = useGlobalPopup();
    const [isScreenShareOpen, setIsScreenShareOpen] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [otherUserId, setOtherUserId] = useState(null);
    const [adminId, setAdminId] = useState(null);
    const peer = useRef(null);
    const localStreamRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!selectedChat.isGroupChat) {
            const otherUser = selectedChat.users.find((u) => u._id !== user._id);
            setOtherUserId(otherUser?._id || null);
        }
    }, [selectedChat, user]);

    useEffect(() => {
        if (!socket) return;

        const handleAdminRequestScreen = ({ adminId }) => {
            startScreenShare(adminId)
            setAdminId(adminId);
        };
        
        const handleUserSendOffer = ({ offer }) => {
            console.log("Admin send offer on listenr")
            const remotePeer = new Peer({
                initiator: false,
                trickle: false,
                config: peerConfig
            });
            remotePeer.signal(offer);

            remotePeer.on("signal", (signal) => {
                socket.emit("admin-send-answer", { answer: signal, adminId: otherUserId });
            });

            remotePeer.on("stream", (stream) => {
                setRemoteStream(stream);
                if (user.role !== "User") {
                    openStreamInNewTab(stream, stopScreenAccessForBoth, localStreamRef);
                }
            });

            remotePeer.on("error", (err) => {
                message.error("Connection failed. Please try again.");
                stopScreenShare();
            });

            peer.current = remotePeer;
        };

        const handleReceiveAnswer = ({ answer }) => {
            if (peer.current) {
                peer.current.signal(answer);
            }
        };

        const handleForceStopScreenShare = () => {
            stopScreenShare();
            message.error("Screen sharing stopped.");
        };
        const handleScreenAccessDenied = () => {
            stopScreenShare();
            message.error("Screen Access Denied", 3);
        }

        const handleScreenAccessConnected = () => {
            console.log("Screen Access Connected")

        }

        socket.on("admin-request-screen", handleAdminRequestScreen);
        socket.on("receive-offer", handleUserSendOffer);
        socket.on("receive-answer", handleReceiveAnswer);
        socket.on("force-stop-screen-share", handleForceStopScreenShare);
        socket.on("screen-share-denied-by-user", handleScreenAccessDenied);
        socket.on("screen-access-connected", handleScreenAccessConnected);

        return () => {
            socket.off("admin-request-screen", handleAdminRequestScreen);
            socket.off("receive-offer", handleUserSendOffer);
            socket.off("receive-answer", handleReceiveAnswer);
            socket.off("force-stop-screen-share", handleForceStopScreenShare);
            socket.off("screen-share-denied-by-user", handleScreenAccessDenied);
            socket.off("screen-access-connected", handleScreenAccessConnected);
        };
    }, [socket, otherUserId]);

    useEffect(() => {
        if (isScreenShareRequested && otherUserId) {
            handleRequestUserScreen();
            setIsScreenShareOpen(true);
        }
    }, [isScreenShareRequested, otherUserId]);

    const startScreenShare = async () => {
        try {
            let stream;

            if (user.role === "User") {
                try {
                    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    audioStream.getAudioTracks().forEach((track) => screenStream.addTrack(track));
                    stream = screenStream;
                } catch (error) {
                    if (error.name === "NotAllowedError") {
                        // Notify the admin that the user denied permission
                        console.log("AdminId:", adminId)
                        socket.emit("screen-share-denied-by-user", { adminId, userId: user._id });
                    } else {
                        message.error("Unable to access screen sharing. Please check your settings.");
                    }
                    throw error;
                }
            } else {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
            }

            if (!stream) {
                throw new Error("No stream available. Please try again.");
            }

            localStreamRef.current = stream;

            const localPeer = new Peer({
                initiator: true,
                trickle: true,
                stream,
                config: peerConfig,
            });

            localPeer.on("signal", (signal) => {
                socket.emit("user-send-offer", { offer: signal, userId: otherUserId });
            });

            localPeer._pc.onconnectionstatechange = () => {
                if (!peer.current || !peer.current._pc) return;
                const state = localPeer._pc.connectionState;
                console.log("Peer connection state:", state);
                if (state === "connected" && user.role === "User") {
                    playAdminVoice();
                    socket.emit("screen-access-connected", { adminId }); 
                }

                if (state === "failed") {
                    message.error("Connection failed. Restarting screen share...");
                    stopScreenShare();
                }
            };

            localPeer.on("error", (error) => {
                console.error("Peer error:", error);
                message.error("An error occurred during screen sharing. Please retry.");
                stopScreenShare();
            });

            peer.current = localPeer;
            setIsScreenShareOpen(true);
        } catch (error) {
            console.error("Failed to start screen sharing:", error);
            const errorMessage = error.name === "NotAllowedError"
                ? "Screen sharing permission denied. Please allow access."
                : "Unable to start screen sharing. Ensure your browser supports this feature.";
            message.error(errorMessage);
        }
    };

    const handleRequestUserScreen = () => {
        if (otherUserId) {
            socket.emit("request-user-screen", { userId: otherUserId, myId: user._id });
            startScreenShare();
        }
    };

    const stopScreenShare = () => {
        try {
            if (peer.current) {
                peer.current.stream?.getTracks().forEach((track) => track.stop());
                peer.current.destroy();
                peer.current = null;
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }
            setRemoteStream(null);
            setIsScreenShareOpen(false);
            setIsScreenShareRequested(false);
            hidePopup();
            console.log("Screen sharing has been stopped successfully.");
        } catch (error) {
            console.error("Error stopping screen share:", error);
        }
    };

    const stopScreenAccessForBoth = () => {
        stopScreenShare();
        socket.emit("force-stop-screen-share", { userId: otherUserId });
    };

    useEffect(() => {
        return () => {
            stopScreenShare();
        };
    }, []);

    const playAdminVoice = () => {
        console.log("Admin Voice Is playing..", remoteStream)
        if (remoteStream && audioRef.current) {
            console.log("Admin Voice Is playing..")
            audioRef.current.srcObject = remoteStream;
            audioRef.current
                .play()
                .catch((error) => console.error("Failed to play remote audio:", error));
        }
    }
    useEffect(() => {
        if (user.role === "User") {
            console.log("Admin Voice Is playing at useeffect", remoteStream)
            if (remoteStream && audioRef.current) {
                console.log("Admin Voice Is playing..")
                audioRef.current.srcObject = remoteStream;
                audioRef.current
                    .play()
                    .catch((error) => console.error("Failed to play remote audio:", error));
            }
        }
    }, [remoteStream])

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            } else {
                console.error("No audio track found to toggle.");
            }
        } else {
            console.error("Local stream is not initialized.");
        }
    };


    useEffect(() => {
        if (isScreenShareOpen && user.role !== "Admin") {
            showPopup(
                <div className="flex items-center justify-center space-x-4">
                    <button onClick={toggleAudio} className="bg-gray-600 text-white p-2 rounded-full">
                        {isAudioMuted ? (
                            <MdMicOff className="text-xl max-md:text-sm" />
                        ) : (
                            <MdMic className="text-xl max-md:text-sm" />
                        )}
                    </button>
                    <button
                        onClick={stopScreenAccessForBoth}
                        className="border-1px border-red-600 bg-transparent hover:bg-red-200 text-red-600 max-md:text-12px p-2 rounded-full"
                    >
                        Stop Share
                    </button>
                </div>
            );
        }
    }, [isScreenShareOpen, isAudioMuted, showPopup]);

    return (
        <>
            <audio ref={audioRef} autoPlay muted={false} style={{ display: "none" }} />
            {!isScreenShareRequested && !isScreenShareOpen && user.role === "Admin" && (
                <button
                    onClick={() => setIsScreenShareRequested(true)}
                    className="px-2 py-1 max-md:px-1 max-md:py-1 border border-green-500 rounded-md text-green-600 text-sm max-md:text-10px bg-transparent hover:bg-green-100 shadow-lg"
                >
                    Access Screen
                </button>
            )}

            {isScreenShareOpen && (user.role === "Admin" || user._id === otherUserId) && (
                <div>
                    {remoteStream ? (
                        <button
                            onClick={stopScreenAccessForBoth}
                            className="px-2 py-1 max-md:px-1 max-md:py-1 border border-red-500 rounded-md text-red-600 text-sm max-md:text-10px bg-transparent hover:bg-red-100 shadow-lg"
                        >
                            Stop Screen Access
                        </button>
                    ) : (
                        <p className="text-gray-500 text-sm max-md:text-10px">Waiting For Screen
                            <span
                                onClick={stopScreenAccessForBoth}
                                className="ml-1 px-2 py-1 max-md:px-1 max-md:py-1 border border-red-500 rounded-md text-red-600 text-sm max-md:text-10px bg-transparent hover:bg-red-100 shadow-lg"
                            >
                                Stop
                            </span>
                        </p>

                    )}
                </div>
            )}
        </>

    );
};

export default ScreenShare;

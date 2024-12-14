import React, { useEffect, useState, useRef } from "react";
import { MdMic, MdMicOff } from "react-icons/md";
import { ChatState } from "../../Context/ChatProvider";
import Peer from "simple-peer";
import peerConfig from "./peerConfig";

const ScreenShare = ({
    socket,
    isScreenShareRequested,
    setIsScreenShareRequested,
}) => {
    const { selectedChat, user } = ChatState();
    const [isScreenShareOpen, setIsScreenShareOpen] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [otherUserId, setOtherUserId] = useState(null);
    const videoRef = useRef(null);
    const peer = useRef(null);
    const localStreamRef = useRef(null);


    useEffect(() => {
        if (!selectedChat.isGroupChat) {
            const otherUser = selectedChat.users.find((u) => u._id !== user._id);
            setOtherUserId(otherUser?._id || null);
        }
    }, [selectedChat, user]);


    // WebRTC and socket setup
    useEffect(() => {
        if (!socket) return;

        const handleAdminRequestScreen = () => {
            startScreenShare();
        };

        const handleAdminSendOffer = ({ offer }) => {
            const remotePeer = new Peer({
                initiator: false,
                trickle: false,
                config: peerConfig
            });
            remotePeer.signal(offer);

            remotePeer.on("signal", (signal) => {
                socket.emit("user-send-answer", { answer: signal, adminId: otherUserId });
            });

            remotePeer.on("stream", (stream) => {
                setRemoteStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            });

            peer.current = remotePeer;
        };

        const handleReceiveAnswer = ({ answer }) => {
            if (peer.current) {
                peer.current.signal(answer);
            }
        };

        const handleScreenShareStopped = () => {
            stopScreenShare();
        };

        const handleForceStopScreenShare = () => {
            stopScreenShare();
            alert("Screen sharing was stopped by the Admin.");
        };

        // Add socket listeners
        socket.on("admin-request-screen", handleAdminRequestScreen);
        socket.on("admin-send-offer", handleAdminSendOffer);
        socket.on("receive-answer", handleReceiveAnswer);
        socket.on("screen-share-stopped", handleScreenShareStopped);
        socket.on("force-stop-screen-share", handleForceStopScreenShare);

        return () => {
            socket.off("admin-request-screen", handleAdminRequestScreen);
            socket.off("admin-send-offer", handleAdminSendOffer);
            socket.off("receive-answer", handleReceiveAnswer);
            socket.off("screen-share-stopped", handleScreenShareStopped);
            socket.off("force-stop-screen-share", handleForceStopScreenShare);

            if (peer.current) peer.current.destroy();
        };
    }, [socket, otherUserId]);

    useEffect(() => {
        if (remoteStream && videoRef.current) {
            videoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        if (isScreenShareRequested && otherUserId) {
            handleRequestUserScreen();
            setIsScreenShareOpen(true);
        }
    }, [isScreenShareRequested, otherUserId]);

    // Start screen sharing
    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });
            localStreamRef.current = stream;

            const localPeer = new Peer({
                initiator: true,
                trickle: false,
                stream,
                config: peerConfig
            });

            localPeer.on("signal", (signal) => {
                socket.emit("admin-send-offer", { offer: signal, userId: otherUserId });
            });

            peer.current = localPeer;
        } catch (error) {
            alert("Unable to start screen sharing. Please allow screen permissions.");
        }
    };

    const handleRequestUserScreen = () => {
        if (otherUserId) {
            socket.emit("request-user-screen", { userId: otherUserId });
        }
    };

    const stopScreenShare = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
        if (peer.current) {
            peer.current.destroy();
            peer.current = null;
        }
        setRemoteStream(null);
        setIsScreenShareOpen(false);
        setIsScreenShareRequested(false);
    };

    const stopScreenAccessForBoth = () => {
        socket.emit("force-stop-screen-share", { userId: otherUserId });
        stopScreenShare();
    };

    const toggleAudio = () => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioMuted(!audioTrack.enabled);
        }
    };

    return (
        <>
            {/* Admin Screen Share UI */}
            {isScreenShareOpen && user.role === "Admin" && (
                <div className="fixed inset-0 flex justify-center items-center bg-gray-900 bg-opacity-75 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
                        <div>
                            {remoteStream ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full border border-gray-500 rounded-lg"
                                />
                            ) : (
                                <p className="text-gray-600">Waiting for user's screen...</p>
                            )}
                        </div>
                        <div className="flex justify-end mt-4 space-x-4">
                            <button
                                onClick={stopScreenAccessForBoth}
                                className="px-4 py-2 bg-red-500 text-white rounded-md"
                            >
                                Stop Screen Access
                            </button>
                            <button
                                onClick={() => setIsScreenShareOpen(false)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Audio and Stop Share Buttons */}
            {isScreenShareOpen && (
                <div className="flex items-center space-x-4 mt-4">
                    <button
                        onClick={toggleAudio}
                        className="bg-gray-600 text-white p-2 rounded-full"
                    >
                        {isAudioMuted ? <MdMicOff className="text-xl" /> : <MdMic className="text-xl" />}
                    </button>
                    <button
                        onClick={stopScreenAccessForBoth}
                        className="bg-red-500 text-white p-2 rounded-full"
                    >
                        Stop Share
                    </button>
                </div>
            )}
        </>
    );
};

export default ScreenShare;

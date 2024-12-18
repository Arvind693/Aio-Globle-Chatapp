import React, { useRef, useState, useEffect } from "react";
import Peer from "simple-peer";
import { MdMic, MdMicOff, MdCallEnd, MdCall, MdVideocam, MdVideocamOff } from "react-icons/md";
import { ChatState } from "../../Context/ChatProvider";
import peerConfig from "./peerConfig";
import SendingMessageAnimation from '../Animations/SendingMessageAnimation';

const VideoCall = ({ socket, isVideoCallStarted, otherUserId, setIsVideoCallStarted, otherUserName, profileImage }) => {
    const { selectedChat, user } = ChatState();
    const [remoteStream, setRemoteStream] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isVideoCallActive, setIsVideoCallActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [callRejectedMessage, setCallRejectedMessage] = useState(null);
    const [acceptCallHandler, setAcceptCallHandler] = useState(() => null);
    const [callerId, setCallerId] = useState(null);
    const [callerName, setCallerName] = useState(null);
    const [ringingTimeout, setRingingTimeout] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const videoRef = useRef(null);
    const peer = useRef(null);
    const [preScreen, setPreScreen] = useState(false);
    const timerIntervalRef = useRef(null);
    const RINGING_DURATION = 30000;

    // Timer Utility: Format seconds into mm:ss
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const startCallTimer = () => {
        setCallDuration(0);
        timerIntervalRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);
    };

    const stopCallTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };
    // Set up WebRTC Peer and Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const handleAdminSendOffer = ({ offer }) => {
            const remotePeer = new Peer({ initiator: false, trickle: false });
            remotePeer.signal(offer);

            remotePeer.on("signal", (signal) => {
                socket.emit("user-send-answer", { answer: signal, adminId: otherUserId });
            });

            remotePeer.on("stream", (stream) => {
                setRemoteStream(stream);
                console.log("RemoteStream is set as:", stream)
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

        const handleIncomingCall = ({ offer, callerId, callerName }) => {
            console.log("handleIncomming call or CallerId:",callerId)
            setCallerName(callerName)
            setIncomingCall(true);
            setCallerId(callerId);

            const timeout = setTimeout(() => {
                rejectCall();
            }, RINGING_DURATION);

            setRingingTimeout(timeout);

            setAcceptCallHandler(() => async () => {
                clearTimeout(timeout);

                // Initialize local stream for the responder
                if (!localStreamRef.current) {
                    await initializeLocalStream();
                }

                // Create a peer instance for the responder
                const remotePeer = new Peer({
                    initiator: false, // Responder
                    trickle: false,
                    stream: localStreamRef.current, // Attach local stream
                    config: peerConfig,
                });

                // Respond with an answer
                remotePeer.signal(offer);

                remotePeer.on("signal", (signal) => {
                    socket.emit("send-video-answer", { answer: signal, callerId });
                });

                remotePeer.on("stream", (stream) => {
                    console.log("Remote stream received on responder side.");
                    setRemoteStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                });

                // Handle errors
                remotePeer.on("error", (err) => console.error("Peer error:", err));

                peer.current = remotePeer;
                setIsVideoCallActive(true);
                setIncomingCall(false);
            });
        };

        const handleReceiveAnswerForCall = ({ answer }) => {
            if (peer.current) {
                peer.current.signal(answer);
            }
        };

        const handleIceCandidate = ({ candidate }) => {
            if (peer.current) {
                peer.current.signal(candidate);
            }
        };

        const handleCallRejected = ({ callerId, reason }) => {
            setCallerId(null);
            stopVideoCall();
            if (callerId === user._id) {
                setCallRejectedMessage(reason || "Your call was rejected.");
                setTimeout(() => setCallRejectedMessage(null), 5000);
            }
        };

        const handleCallEnded = () => {
            setCallerId(null);
            setIsVideoMuted(false);
            setIsAudioMuted(false);
            setIncomingCall(false);
            stopCallTimer();
            stopVideoCall();
            setCallRejectedMessage("Call Ended")
            setTimeout(() => setCallRejectedMessage(null), 5000);
        }

        const handleCallAcceptedByOtherUser = () => {
            setPreScreen(false);
            startCallTimer();
        }

        // Add socket listeners
        socket.on("admin-send-offer", handleAdminSendOffer);
        socket.on("receive-answer", handleReceiveAnswer);
        socket.on("incoming-video-call", handleIncomingCall);
        socket.on("receive-video-answer", handleReceiveAnswerForCall);
        socket.on("receive-ice-candidate", handleIceCandidate);
        socket.on("call-rejected", handleCallRejected);
        socket.on("call-ended", handleCallEnded);
        socket.on('call-accepted-by-other-user', handleCallAcceptedByOtherUser);

        return () => {
            socket.off("admin-send-offer", handleAdminSendOffer);
            socket.off("receive-answer", handleReceiveAnswer);
            socket.off("incoming-video-call", handleIncomingCall);
            socket.off("receive-video-answer", handleReceiveAnswerForCall);
            socket.off("receive-ice-candidate", handleIceCandidate);
            socket.off("call-rejected", handleCallRejected);
            socket.off("call-ended", handleCallEnded);
            socket.on('call-accepted-by-other-user', handleCallAcceptedByOtherUser);

            if (peer.current) peer.current.destroy();
        };
    }, [socket, selectedChat]);

    useEffect(() => {
        if (remoteStream && videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play();
        }
    }, [remoteStream]);

    useEffect(() => {
        if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [localStreamRef.current]);

    // Handle setting up the local video stream
    const initializeLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error("Error accessing camera or microphone:", error);
            alert("Unable to access camera or microphone. Please check permissions.");
        }
    };



    const startVideoCall = async () => {
        setCallDuration(0);
        setPreScreen(true);
        if (!localStreamRef.current) {
            await initializeLocalStream();
        }

        const localPeer = new Peer({
            initiator: true,
            trickle: false,
            stream: localStreamRef.current,
            config: peerConfig,
        });

        localPeer.on("signal", (signal) => {
            socket.emit("start-video-call", { offer: signal, userId: otherUserId, myId: user._id, myName: user.name });
        });

        const timer = setTimeout(() => {
            stopVideoCall();
            socket.emit("call-timeout", { userId: callerId });
        }, RINGING_DURATION);

        setRingingTimeout(timer);

        socket.on("call-accepted-by-other-user", () => {
            clearTimeout(timer);
        });

        localPeer.on("stream", (stream) => {
            clearTimeout(timer);
            setRemoteStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        });

        localPeer.on("error", (err) => {
            console.error("Peer error:", err);
        });

        peer.current = localPeer;
        setIsVideoCallActive(true);
        setCallerId(otherUserId);
    };

    useEffect(() => {
        if (isVideoCallStarted && otherUserId) {
            startVideoCall();
        }
    }, [isVideoCallStarted, otherUserId]);


    const stopVideoCall = () => {
        setIsVideoMuted(false);
        setIsAudioMuted(false);
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
        setIsVideoCallActive(false);
        setIsVideoCallStarted(false);
        if (ringingTimeout) clearTimeout(ringingTimeout);
        setRingingTimeout(null);
        socket.emit("end-video-call", { userId: callerId });
        setCallRejectedMessage(null);
        stopCallTimer();
        setCallerId(null);
    };

    useEffect(() => {
        return () => {
            stopCallTimer();
        };
    }, []);

    const acceptCall = () => {
        if (acceptCallHandler) acceptCallHandler();
        if (ringingTimeout) {
            clearTimeout(ringingTimeout);
            setRingingTimeout(null);
        }
        socket.emit("call-accepted", { callerId });
        startCallTimer();
    };

    const rejectCall = () => {
        setIncomingCall(false);
        setCallerId(null);
        setCallerName(null);
        socket.emit("reject-video-call", { callerId });
        if (ringingTimeout) {
            clearTimeout(ringingTimeout);
            setRingingTimeout(null);
        }
        if (peer.current) {
            peer.current.destroy();
            peer.current = null;
        }
    };

    const toggleAudio = () => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioMuted(!audioTrack.enabled);
        }
    };

    const toggleVideo = () => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoMuted(!videoTrack.enabled);
        }
    };


    return (
        <>
            {incomingCall && (
                <div
                    className="absolute left-1/2 top-20 transform -translate-x-1/2 w-56 bg-gray-900 bg-opacity-85 z-50 p-5 rounded-lg shadow-lg"
                >
                    <p className="text-white text-12px mb-5">
                        <span className="font-bold text-sm text-yellow-500">{callerName}</span> is inviting you to join a video call!
                    </p>
                    <div className="flex justify-between items-center space-x-4">
                        <button
                            onClick={acceptCall}
                            className="bg-green-500 text-white p-2 rounded-full flex items-center max-md:text-xs"
                        >
                            <MdCall className="text-xl max-md:text-sm" /> Accept
                        </button>
                        <button
                            onClick={rejectCall}
                            className="bg-red-500 text-white p-2 rounded-full flex items-center max-md:text-xs"
                        >
                            <MdCallEnd className="text-xl max-md:text-sm" /> Reject
                        </button>
                    </div>
                </div>
            )}

            {/* Video Call Controls */}
            {isVideoCallActive && (
                <div className="absolute top-0 -left-8 right-0 bottom-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-100">
                    {/* Display Call Timer */}
                    {callDuration && (
                        <div className="absolute top-2 left-2 transform -translate-x-1/2 bg-gray-800 bg-opacity-20 text-white px-4 py-2 max-md:px-2 max-md:py-1 max-md:text-12px rounded-lg shadow-lg z-50">
                            {formatTime(callDuration)}
                        </div>
                    )}
                    {/* Remote Video */}
                    <div className="relative w-full h-full">
                        {!preScreen ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-800 text-white text-lg">
                                <div className="flex flex-col items-center space-y-4">
                                    {/* Display Profile Image and Chat Name */}
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={profileImage}
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <p className="text-lg font-semibold">{otherUserName}</p>
                                    </div>

                                    {/* Requesting Video Call Animation */}
                                    <div className="flex items-center space-x-2">
                                        <p className="max-md:text-xs">Requesting <span className="text-yellow-600">{otherUserName}</span> to join video call</p>
                                        <div className="mt-2">
                                        <SendingMessageAnimation/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Local Video Overlay */}
                        <div className="absolute top-4 right-4 w-32 h-24 md:w-48 md:h-32 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Controls */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                            {/* End Call Button */}
                            <button
                                onClick={stopVideoCall}
                                className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                            >
                                <MdCallEnd className="text-2xl" />
                            </button>
                            {/* Toggle Audio Button */}
                            <button
                                onClick={toggleAudio}
                                className="flex items-center justify-center w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg"
                            >
                                {isAudioMuted ? (
                                    <MdMicOff className="text-2xl" />
                                ) : (
                                    <MdMic className="text-2xl" />
                                )}
                            </button>
                            <button
                                onClick={toggleVideo}
                                className="flex items-center justify-center w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg"
                            >
                                {isVideoMuted ? <MdVideocamOff className="text-2xl" /> : <MdVideocam className="text-2xl" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {callRejectedMessage && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    {callRejectedMessage}
                </div>
            )}
        </>
    );
};

export default VideoCall;

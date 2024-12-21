import React, { useRef, useState, useEffect } from "react";
import Peer from "simple-peer";
import { MdMic, MdMicOff, MdCallEnd, MdCall, } from "react-icons/md";
import { ChatState } from "../../../Context/ChatProvider";
import peerConfig from "../peerConfig";
import SendingMessageAnimation from '../../Animations/SendingMessageAnimation';
import { message } from "antd";
import RingtoneHandler from "../RingtoneHandler";

const AudioCall = ({ socket, isAudioCallStarted, otherUserId, setIsAudioCallStarted, otherUserName, profileImage }) => {
    const { selectedChat, user } = ChatState();
    const [remoteStream, setRemoteStream] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isAudioCallActive, setIsAudioCallActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [callRejectedMessage, setCallRejectedMessage] = useState(null);
    const [acceptCallHandler, setAcceptCallHandler] = useState(() => null);
    const [callerId, setCallerId] = useState(null);
    const [callerName, setCallerName] = useState(null);
    const [ringingTimeout, setRingingTimeout] = useState(null);
    const [isRinging, setIsRinging] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const localStreamRef = useRef(null);
    const remoteAudioRef = useRef(null);
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
            });

            peer.current = remotePeer;
        };

        const handleReceiveAnswer = ({ answer }) => {
            if (peer.current) {
                peer.current.signal(answer);
            }
        };

        const handleIncomingCall = ({ offer, callerId, callerName }) => {
            console.log("handleIncomming call or CallerId:", callerId)
            setCallerName(callerName)
            setIncomingCall(true);
            setIsRinging(true);
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
                    initiator: false,
                    trickle: false,
                    stream: localStreamRef.current,
                    config: peerConfig,
                });

                // Respond with an answer
                remotePeer.signal(offer);

                remotePeer.on("signal", (signal) => {
                    socket.emit("send-audio-answer", { answer: signal, callerId });
                });

                remotePeer.on("stream", (stream) => {
                    console.log("Remote stream received on responder side.");
                    setRemoteStream(stream);
                });

                // Handle errors
                remotePeer.on("error", (err) => console.error("Peer error:", err));

                peer.current = remotePeer;
                setIsAudioCallActive(true);
                setIncomingCall(false);
                setIsRinging(false);
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
            stopAudioCall();
            if (callerId === user._id) {
                setCallRejectedMessage(reason || "Your call was rejected.");
                setTimeout(() => setCallRejectedMessage(null), 5000);
            }
        };

        const handleCallEnded = () => {
            setCallerId(null);
            setIsAudioMuted(false);
            setIncomingCall(false);
            setIsRinging(false);
            stopCallTimer();
            stopAudioCall();
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
        socket.on("incoming-audio-call", handleIncomingCall);
        socket.on("receive-audio-answer", handleReceiveAnswerForCall);
        socket.on("receive-ice-candidate", handleIceCandidate);
        socket.on("audio-call-rejected", handleCallRejected);
        socket.on("audio-call-ended", handleCallEnded);
        socket.on('audio-call-accepted-by-other-user', handleCallAcceptedByOtherUser);

        return () => {
            socket.off("admin-send-offer", handleAdminSendOffer);
            socket.off("receive-answer", handleReceiveAnswer);
            socket.off("incoming-audio-call", handleIncomingCall);
            socket.off("receive-audio-answer", handleReceiveAnswerForCall);
            socket.off("receive-ice-candidate", handleIceCandidate);
            socket.off("audio-call-rejected", handleCallRejected);
            socket.off("audio-call-ended", handleCallEnded);
            socket.on('audio-call-accepted-by-other-user', handleCallAcceptedByOtherUser);

            if (peer.current) peer.current.destroy();
        };
    }, [socket, selectedChat]);

    useEffect(() => {
        if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch((error) => {
                console.error("Error playing remote audio stream:", error);
            });
        }
    }, [remoteStream]);

    // Handle setting up the local video stream
    const initializeLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
        } catch (error) {
            console.error("Error accessing microphone:", error);
            message.error("Unable to access microphone. Please check permissions.", 3);
        }
    };



    const startAudioCall = async () => {
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
            socket.emit("start-audio-call", { offer: signal, userId: otherUserId, myId: user._id, myName: user.name });
        });

        const timer = setTimeout(() => {
            stopAudioCall();
            socket.emit("audio-call-timeout", { userId: callerId });
        }, RINGING_DURATION);

        setRingingTimeout(timer);

        socket.on("audio-call-accepted-by-other-user", () => {
            clearTimeout(timer);
        });

        localPeer.on("stream", (stream) => {
            clearTimeout(timer);
            setRemoteStream(stream);
        });

        localPeer.on("error", (err) => {
            console.error("Peer error:", err);
        });

        peer.current = localPeer;
        setIsAudioCallActive(true);
        setCallerId(otherUserId);
    };

    useEffect(() => {
        if (isAudioCallStarted && otherUserId) {
            startAudioCall();
        }
    }, [isAudioCallStarted, otherUserId]);


    const stopAudioCall = () => {
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
        setIsAudioCallActive(false);
        setIsAudioCallStarted(false);
        if (ringingTimeout) clearTimeout(ringingTimeout);
        setRingingTimeout(null);
        socket.emit("end-audio-call", { userId: callerId });
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
        socket.emit("audio-call-accepted", { callerId });
        startCallTimer();
    };

    const rejectCall = () => {
        setIncomingCall(false);
        setIsRinging(false);
        setCallerId(null);
        setCallerName(null);
        socket.emit("reject-audio-call", { callerId });
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


    return (
        <>
            {incomingCall && (
                <div
                    className="absolute left-1/2 top-20 transform -translate-x-1/2 w-56 bg-gray-900 bg-opacity-85 z-50 p-5 rounded-lg shadow-lg"
                >
                    <p className="text-white text-12px mb-5">
                        <span className="font-bold text-sm text-yellow-500">{callerName}</span> is inviting you to join a audio call!
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
            {isAudioCallActive && (
                <div className="absolute top-0 -left-8 right-0 bottom-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-100">
                    <div className="relative w-full h-full">
                        {!preScreen ? (
                            <div className="flex items-center justify-center w-full h-full bg-gray-800 text-white text-lg">
                                <div className="flex flex-col items-center space-y-4">
                                    {/* Display Call Timer */}
                                    {callDuration && (
                                        <div className="  text-white text-sm md:text-base px-3 py-1 md:px-4 md:py-2 rounded-lg shadow-md">
                                            {formatTime(callDuration)}
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={profileImage}
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <p className="text-lg font-semibold">{otherUserName}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <p className="max-md:text-xs"><span className="text-yellow-600">{otherUserName}</span> is on call</p>
                                    </div>
                                </div>
                            </div>
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

                                    {/* Requesting Audio Call Animation */}
                                    <div className="flex items-center space-x-2">
                                        <p className="max-md:text-xs">Requesting <span className="text-yellow-600">{otherUserName}</span> to join audio call</p>
                                        <div className="mt-2">
                                            <SendingMessageAnimation />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Audio Element */}
                        <audio autoPlay ref={remoteAudioRef} controls={false}>
                            Your browser does not support the audio element.
                        </audio>

                        {/* Controls */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                            {/* End Call Button */}
                            <button
                                onClick={stopAudioCall}
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
                        </div>
                    </div>
                </div>
            )}
            {callRejectedMessage && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    {callRejectedMessage}
                </div>
            )}
            <RingtoneHandler play={isRinging} stop={!isRinging}/>
        </>
    );
};

export default AudioCall;

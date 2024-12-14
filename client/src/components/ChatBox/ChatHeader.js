import React, { useEffect, useState, useRef } from "react";
import { MdCameraAlt, MdMic, MdMicOff, MdCallEnd, MdCall, MdVideoCall } from "react-icons/md";
import { ChatState } from "../../Context/ChatProvider";
import Peer from "simple-peer";

const ChatHeader = ({ socket, handleScreenshot, setUserDetailsModal }) => {
  const { selectedChat, user } = ChatState();
  const [isScreenShareOpen, setIsScreenShareOpen] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callRejectedMessage, setCallRejectedMessage] = useState(null);
  const [acceptCallHandler, setAcceptCallHandler] = useState(() => null);
  const [callerId, setCallerId] = useState(null);
  const [callerName, setCallerName] = useState(null);
  const [ringingTimeout, setRingingTimeout] = useState(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const videoRef = useRef(null);
  const peer = useRef(null);

  const RINGING_DURATION = 30000;

  const peerConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }, // STUN server
      {
        urls: "turn:relay1.expressturn.com:3478", // TURN server URL
        username: "efZ0K679YF4KIYHP9Z", // TURN server username
        credential: "NlEVvoIe0QH7LZ2B", // TURN server password
      },
    ],
  };

  useEffect(() => {
    if (!selectedChat.isGroupChat) {
      const otherUser = selectedChat.users.find((u) => u._id !== user._id);
      setOtherUserId(otherUser?._id || null);
    }
  }, [selectedChat, user]);

  // Set up WebRTC Peer and Socket Listeners
  useEffect(() => {
    if (!socket) return;

    // Handle admin's request to access user's screen
    const handleAdminRequestScreen = () => {
      startScreenShare();
    };

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

    const handleScreenShareStopped = () => {
      setRemoteStream(null);
      setIsScreenShareOpen(false);
    };

    const handleIncomingCall = ({ offer, callerId, callerName }) => {
      setCallerName(callerName)
      setIncomingCall(true);
      setCallerId(callerId);

      const timeout = setTimeout(() => {
        rejectCall();
      }, RINGING_DURATION);

      setRingingTimeout(timeout);

      setAcceptCallHandler(() => () => {
        clearTimeout(timeout);
        const remotePeer = new Peer({ initiator: false, trickle: false, config: peerConfig });

        remotePeer.signal(offer);

        remotePeer.on("signal", (signal) => {
          socket.emit("send-video-answer", { answer: signal, callerId });
        });

        remotePeer.on("stream", (stream) => {
          setRemoteStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        });

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
      stopVideoCall();
      if (callerId === user._id) {
        setCallRejectedMessage(reason || "Your call was rejected.");
        setTimeout(() => setCallRejectedMessage(null), 5000);
      }
    };

    const handleCallEnded = () => {
      stopVideoCall();
      setCallRejectedMessage("Call Ended")
      setTimeout(() => setCallRejectedMessage(null), 5000);
    }

    // Add socket listeners
    socket.on("admin-request-screen", handleAdminRequestScreen);
    socket.on("admin-send-offer", handleAdminSendOffer);
    socket.on("receive-answer", handleReceiveAnswer);
    socket.on("screen-share-stopped", handleScreenShareStopped);
    socket.on("incoming-video-call", handleIncomingCall);
    socket.on("receive-video-answer", handleReceiveAnswerForCall);
    socket.on("receive-ice-candidate", handleIceCandidate);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("admin-request-screen", handleAdminRequestScreen);
      socket.off("admin-send-offer", handleAdminSendOffer);
      socket.off("receive-answer", handleReceiveAnswer);
      socket.off("screen-share-stopped", handleScreenShareStopped);
      socket.off("incoming-video-call", handleIncomingCall);
      socket.off("receive-video-answer", handleReceiveAnswerForCall);
      socket.off("receive-ice-candidate", handleIceCandidate);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);

      if (peer.current) peer.current.destroy();
    };
  }, [socket]);

  useEffect(() => {
    if (remoteStream && videoRef.current) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.play();
    }
  }, [remoteStream]);

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const localPeer = new Peer({ initiator: true, trickle: false, stream, config: peerConfig, });

      localPeer.on("signal", (signal) => {
        socket.emit("admin-send-offer", { offer: signal, userId: otherUserId });
      });

      localPeer.on("stream", (stream) => {
        setRemoteStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });

      peer.current = localPeer;
      setIsScreenShareOpen(!isScreenShareOpen);
    } catch (error) {
      console.error("Error starting screen sharing:", error);
      alert("Unable to start screen sharing. Please allow screen permissions.");
    }
  };

  // Handle Admin requesting the user's screen
  const handleRequestUserScreen = () => {
    if (otherUserId) {
      socket.emit("request-user-screen", { userId: otherUserId });
    } else {
      console.error("No user ID found for screen request.");
    }
  };

  // Toggle Screen Share Modal
  const handleScreenShareToggle = () => {
    setIsScreenShareOpen(!isScreenShareOpen);
  };

  const stopScreenShare = () => {
    if (peer.current) {
      peer.current.stream?.getTracks().forEach((track) => track.stop());
      socket.emit("screen-share-stopped", { userId: otherUserId });
      peer.current.destroy();
      peer.current = null;
      setRemoteStream(null);
      setIsScreenShareOpen(false);
    }
  };

  const toggleAudio = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };


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
      socket.emit("call-timeout", { userId: otherUserId });
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
  };


  const stopVideoCall = () => {
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
    if (ringingTimeout) clearTimeout(ringingTimeout);
    setRingingTimeout(null);
    socket.emit("end-video-call", { userId: otherUserId });
  };

  const acceptCall = () => {


    if (acceptCallHandler) acceptCallHandler();
    if (ringingTimeout) {
      clearTimeout(ringingTimeout);
      setRingingTimeout(null);
    }
    socket.emit("call-accepted", { callerId });
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
  // Get Chat Name and Profile Image
  const getChatName = () =>
    selectedChat.isGroupChat
      ? selectedChat.chatName
      : selectedChat.users.find((u) => u._id !== user._id)?.name || "Chat";

  const getProfileImage = () =>
    selectedChat.isGroupChat
      ? selectedChat.groupImage ||
      "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
      : selectedChat.users.find((u) => u._id !== user._id)?.profileImage ||
      "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";

  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [localStreamRef.current]);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-transparent text-white p-4 max-md:p-2 flex items-center justify-between space-x-3 md:space-x-4">
      <div className="flex justify-center items-center gap-1">
        <div
          className="h-10 w-10 max-md:h-6 max-md:w-6 rounded-full overflow-hidden cursor-pointer"
          onClick={() => {
            if (user?.role === 'Admin') {
              setUserDetailsModal(true);
            }
          }}
        >
          <img
            src={getProfileImage()}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        </div>


        <h3 className="text-lg max-md:text-10px text-black font-semibold truncate">
          {getChatName()}
        </h3>
      </div>

      {/* Admin-Specific Controls */}
      {!selectedChat.isGroupChat && user.role === "Admin" ? (
        <button
          onClick={() => {
            handleRequestUserScreen();
            handleScreenShareToggle();
          }}
          className="relative flex items-center justify-center px-2 py-2 border-1px border-green-500 rounded-md text-green-600 text-sm max-md:text-xs 
             bg-transparent hover:bg-green-100 shadow-lg hover:shadow-xl"
        >
          Access {getChatName()}'s Screen
        </button>
      ) : null}

      {/* Screenshot Button */}
      <button
        onClick={handleScreenshot}
        className="flex max-md:text-10px bg-gradient-to-r from-blue-600 to-red-400 text-white px-3 py-1 rounded-md hover:bg-blue-700"
      >
        <MdCameraAlt size={20} className="max-md:hidden" />
        <span>Screenshot</span>
      </button>

      {/* Screen Share Modal */}
      {isScreenShareOpen && user.role === "Admin" && (
        <div className="text-black fixed inset-0 flex justify-center items-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
            <div>
              {remoteStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: "100%", border: "1px solid black" }}
                />
              ) : (
                <p>Waiting for the user's screen...</p>
              )}
            </div>
            <div className="flex justify-end mt-4 space-x-4">
              <button
                onClick={stopScreenShare}
                className="px-4 py-2 bg-red-500 text-white rounded-md"
              >
                Stop Screen Access
              </button>
              <button
                onClick={handleScreenShareToggle}
                className="px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {(isScreenShareOpen || isVideoCallActive) && (
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleAudio}
            className="bg-gray-600 text-white p-2 rounded-full"
          >
            {isAudioMuted ? <MdMicOff className="text-xl max-md:text-sm" /> : <MdMic className="text-xl max-md:text-sm" />}
          </button>

          {isScreenShareOpen && (
            <button
              onClick={stopScreenShare}
              className="bg-red-500 text-white p-2 rounded-full"
            >
              Stop Share
            </button>
          )}
        </div>
      )}
      {/* Start Video Calling Button  */}
      {!selectedChat.isGroupChat && (
        <button
          onClick={startVideoCall}
          className="bg-green-500 text-white p-2 rounded-full"
        >
          <MdVideoCall className="text-xl max-md:text-sm" />
        </button>
      )}


      {/* Incoming Call Notification */}
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80">
          {/* Remote Video */}
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

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
            </div>
          </div>
        </div>
      )}
      {callRejectedMessage && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {callRejectedMessage}
        </div>
      )}
    </div>
  );
};

export default ChatHeader;

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
  
  export default peerConfig;
  
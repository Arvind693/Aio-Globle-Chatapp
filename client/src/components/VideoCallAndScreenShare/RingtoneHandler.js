import React, { useEffect, useRef } from "react";

const RingtoneHandler = ({ play, stop }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (play) {
      audioRef.current.play().catch((err) => console.error("Error playing ringtone:", err));
    }
    if (stop) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [play, stop]);

  return (
    <audio ref={audioRef} loop>
      <source src="/Ringtone-Sound/ringtone-2.mp3" type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
};

export default RingtoneHandler;

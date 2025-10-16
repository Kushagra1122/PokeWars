import React from 'react';

const Timer = ({ timeLeft }) => {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className="text-4xl font-bold font-mono tracking-wider bg-gradient-to-b from-black/50 to-black/70 px-8 py-3 rounded-xl shadow-2xl border border-yellow-400/40 mt-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-2xl">⏱</span>
        <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
          {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
        </span>
      </div>
    </div>
  );
};

export default Timer;

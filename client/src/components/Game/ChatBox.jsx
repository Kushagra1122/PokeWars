import React, { useState, useRef, useEffect } from 'react';

const ChatBox = ({ messages, setMessages, socket, user, gameCode }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      playerId: user.id,
      playerName: user.name,
      text: newMessage.trim(),
      gameCode,
      timestamp: Date.now(),
      type: 'player'
    };

    socket.emit('sendGameMessage', messageData);
    setNewMessage('');
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`bg-gradient-to-b from-black/30 to-black/50 p-4 rounded-xl flex flex-col backdrop-blur-md border border-yellow-400/20 shadow-lg transition-all duration-300 w-1/4 ${
  isCollapsed ? 'h-auto' : 'h-80'
}`}>

      <div
        className="flex items-center justify-between mb-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          <h2 className="font-bold text-yellow-300 text-lg">Game Chat</h2>
        </div>
        <span className={`text-yellow-400 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
          ▲
        </span>
      </div>

      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-yellow-400/30 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="text-yellow-200/60 italic text-center py-8">
                💬 No messages yet...
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-2 text-sm ${
                    msg.type === 'system'
                      ? 'bg-purple-900/50 text-yellow-400 italic border border-purple-500/30 text-center'
                      : msg.self
                      ? 'bg-green-900/40 text-green-300 ml-4 border border-green-500/30'
                      : 'bg-blue-900/40 text-blue-200 mr-4 border border-blue-500/30'
                  }`}
                >
                  {msg.type !== 'system' && (
                    <div className={`flex items-center justify-between mb-1 ${msg.self ? 'flex-row-reverse' : ''}`}>
                      <span className={`font-medium text-xs ${msg.self ? 'text-green-400' : 'text-blue-300'}`}>
                        {msg.self ? 'You' : msg.playerName}
                      </span>
                      <span className="text-xs text-gray-400">{formatMessageTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <div className={msg.type === 'system' ? 'font-medium' : ''}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="mt-3 flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-lg px-3 py-2 text-sm text-white bg-gray-800/80 border border-gray-600/50 focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/20 placeholder-gray-400"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black px-4 py-2 rounded-lg font-semibold text-sm hover:from-yellow-400 hover:to-yellow-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatBox;

import React, { useState, useEffect } from 'react';

const GIFS = {
  closed: '../gif/chat-closed.gif',
  opening: '../gif/chat-opening.gif',
  waiting: '../gif/chat-waiting.gif',
  loading: '../gif/chat-loading.gif',
  closing: '../gif/chat-closing.gif'
};

function ChatButton({ chatOpen, setChatOpen, loading }) {
  const [buttonState, setButtonState] = useState('closed');

  useEffect(() => {
    let timer;
    if (buttonState === 'opening') {
      timer = setTimeout(() => {
        setButtonState('waiting');
        setChatOpen(true);
      }, 1500);
    } else if (buttonState === 'closing') {
      timer = setTimeout(() => {
        setButtonState('closed');
        setChatOpen(false);
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [buttonState, setChatOpen]);

  useEffect(() => {
    if (loading) {
      setButtonState('loading');
    } else {
      if (chatOpen) setButtonState('waiting');
      else setButtonState('closed');
    }
  }, [loading, chatOpen]);

  const handleClick = () => {
    if (buttonState === 'closed') {
      setButtonState('opening');
    } else if (buttonState === 'waiting') {
      setButtonState('closing');
    }
  };

  let gifSrc = GIFS.closed;
  if (buttonState === 'opening') gifSrc = GIFS.opening;
  else if (buttonState === 'waiting') gifSrc = GIFS.waiting;
  else if (buttonState === 'loading') gifSrc = GIFS.loading;
  else if (buttonState === 'closing') gifSrc = GIFS.closing;

  return (
    <button className="chat-button" onClick={handleClick} disabled={buttonState === 'loading'} style={{ padding: 0, border: 'none', background: 'transparent' }}>
      <img src={gifSrc} alt="chat button" style={{ width: '50px', height: '50px', pointerEvents: 'none' }} />
    </button>
  );
}

export default ChatButton;

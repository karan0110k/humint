import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';

const Chat = () => {
  const [chatSessions, setChatSessions] = useState([
    { id: '1', title: 'Current Conversation', messages: [] },
    { id: '2', title: 'React Learning', messages: [] },
    { id: '3', title: 'Project Ideas', messages: [] },
  ]);
  const [activeSession, setActiveSession] = useState('1');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef(null);

  const suggestions = [
    'What can you do?',
    'How are you?',
    'Tell me a joke',
    'Who built you?',
    'Summarize a news article',
    'How to learn React?'
  ];

  // Get current messages
  const currentMessages = chatSessions.find(session => session.id === activeSession)?.messages || [];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSuggestionClick = (text) => {
    setInput(text);
    document.getElementById('chat-input')?.focus();
  };

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newSession = {
      id: newId,
      title: 'New Conversation',
      messages: []
    };
    setChatSessions([newSession, ...chatSessions]);
    setActiveSession(newId);
    setInput('');
  };

  const updateSessionTitle = (sessionId, newTitle) => {
    setChatSessions(chatSessions.map(session => 
      session.id === sessionId ? { ...session, title: newTitle } : session
    ));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    
    // Update current session with new message
    const updatedSessions = chatSessions.map(session => {
      if (session.id === activeSession) {
        // Update title if it's the first message
        const shouldUpdateTitle = session.messages.length === 0 && session.title === 'New Conversation';
        const newTitle = shouldUpdateTitle 
          ? input.slice(0, 30) + (input.length > 30 ? '...' : '')
          : session.title;
        
        return {
          ...session,
          title: newTitle,
          messages: [...session.messages, userMessage]
        };
      }
      return session;
    });

    setChatSessions(updatedSessions);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4003/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      if (data.response) {
        const botMessage = { role: 'assistant', content: data.response };
        
        // Update session with bot response
        setChatSessions(chatSessions.map(session => {
          if (session.id === activeSession) {
            return {
              ...session,
              messages: [...session.messages, botMessage]
            };
          }
          return session;
        }));
      }
    } catch (error) {
      const errorMessage = { role: 'error', content: '⚠️ Sorry, something went wrong. Please try again.' };
      setChatSessions(chatSessions.map(session => {
        if (session.id === activeSession) {
          return {
            ...session,
            messages: [...session.messages, errorMessage]
          };
        }
        return session;
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <div className="chat-wrapper">
      {!isMobile && (
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Humint</h2>
            <button className="new-chat-btn" onClick={createNewChat}>
              <span>+</span> New chat
            </button>
          </div>
          <div className="chat-history">
            {chatSessions.map((session) => (
              <div 
                key={session.id} 
                className={`history-item ${activeSession === session.id ? 'active' : ''}`}
                onClick={() => setActiveSession(session.id)}
              >
                {session.title}
              </div>
            ))}
          </div>
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="avatar">U</div>
              <span>User</span>
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        {currentMessages.length === 0 ? (
          <div className="welcome-screen">
            <div className="logo">
              <div className="logo-circle">H</div>
              <h1>Humint</h1>
            </div>
            <h2>How can I help you today?</h2>
            <div className="suggestions-grid">
              {suggestions.map((q, i) => (
                <div key={i} className="suggestion-card" onClick={() => handleSuggestionClick(q)}>
                  <h3>{q}</h3>
                  <div className="arrow-icon">→</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {currentMessages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <div className="avatar">{m.role === 'user' ? '👤' : m.role === 'assistant' ? '🤖' : '⚠️'}</div>
                <div className="message-content">
                  <div className="text">{m.content}</div>
                  {m.role === 'assistant' && (
                    <div className="message-actions">
                      <button className="action-btn">👍</button>
                      <button className="action-btn">👎</button>
                      <button className="action-btn">↻</button>
                      <button className="action-btn">⋮</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <form className="chat-input-container" onSubmit={sendMessage}>
          <div className="input-wrapper">
            <div className="input-actions">
              <button type="button" className="attach-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <textarea
              id="chat-input"
              placeholder="Message Humint..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows="1"
            />
            <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <div className="disclaimer">
            Humint may display inaccurate info, including about people, so double-check its responses.
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
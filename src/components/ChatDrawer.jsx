import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, X, ShieldCheck, Activity, ArrowRight, Zap, Square } from 'lucide-react';
import xchangeCoreImg from '../assets/xchange_core.png';
import { sendChatMessage, fetchSessionHistory } from '../lib/api';

const QUICK_ACTIONS = [
  { label: '✨ Proactive Insight', prompt: 'Show me a proactive insight for today' },
  { label: '💰 Price item',        prompt: 'I need help pricing an item I want to sell' },
  { label: '🔄 Suggest trades',    prompt: 'Suggest fair trade options for me' },
  { label: '🌐 Circular Trade',   prompt: 'Search for circular multi-hop trade opportunities in the ecosystem' },
  { label: '📈 P2P Credit',       prompt: 'I want to know about P2P credit and investment options' },
];

// ── Minimum recording duration in ms ──────────────────────────────────────────
const MIN_RECORDING_MS = 1000;

// ── Format seconds as M:SS ────────────────────────────────────────────────────
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const ChatDrawer = ({ isOpen, onClose, onNavigate }) => {
  const [sessionId, setSessionId]   = useState('');
  const [messages, setMessages]     = useState([]);
  const [inputText, setInputText]   = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping]     = useState(false);
  const [canStop, setCanStop]       = useState(false);   // enforce min duration
  const [recSeconds, setRecSeconds] = useState(0);       // live timer

  // Refs
  const messagesEndRef    = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const streamRef         = useRef(null);
  const audioChunksRef    = useRef([]);
  const recStartRef       = useRef(null);
  const recTimerRef       = useRef(null);
  const canStopTimerRef   = useRef(null);

  // ── Scroll to bottom ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Session init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let sid = localStorage.getItem('ipeCoreSessionId');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('ipeCoreSessionId', sid);
    }
    setSessionId(sid);
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(recTimerRef.current);
      clearTimeout(canStopTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ── Load history on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && sessionId) loadHistory();
  }, [isOpen, sessionId]);

  const loadHistory = async () => {
    setIsTyping(true);
    const history = await fetchSessionHistory(sessionId);
    setIsTyping(false);
    if (history.length === 0) {
      setMessages([{
        role: 'agent',
        content: "Hello! I'm **Xchange Core** — your AI guide to the Ipê network. Ask me anything, or tap the mic to speak!",
        cta: null,
      }]);
    } else {
      setMessages(history);
    }
  };

  // ── Send message (text OR audio) ─────────────────────────────────────────────
  const handleSendMessage = useCallback(async (text, isAudio = false, audioBase64 = null, mimeType = null, audioDuration = null) => {
    if (!text.trim() && !audioBase64) return;

    const displayContent = isAudio && !text.trim()
      ? `🎤 Voice message${audioDuration ? ` · ${formatDuration(audioDuration)}` : ''}`
      : text;

    setMessages(prev => [...prev, { role: 'user', content: displayContent, cta: null, isAudio }]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(sessionId, text, isAudio, audioBase64, mimeType);
      setMessages(prev => [...prev, {
        role: 'agent',
        content: response.text,
        cta: response.cta,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: 'Sorry, a connection error occurred. Please try again.',
        cta: null,
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId]);

  // ── Recording: start ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      if (!window.MediaRecorder) {
        alert('Your browser does not support audio recording. Please update it.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick the best supported MIME type
      const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      let chosenMime = '';
      for (const type of MIME_TYPES) {
        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(type)) {
          chosenMime = type;
          break;
        }
      }

      const options = chosenMime ? { mimeType: chosenMime } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect chunks every 250ms — key fix for Safari reliability
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener('stop', () => {
        const finalMime = mediaRecorder.mimeType || chosenMime || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });

        // Guard against empty blobs
        if (audioBlob.size < 500) {
          setMessages(prev => [...prev, {
            role: 'agent',
            content: 'Recording was too short. Please hold the mic button for at least 1 second.',
            cta: null,
          }]);
          streamRef.current?.getTracks().forEach(t => t.stop());
          return;
        }

        const durationSec = Math.round((Date.now() - recStartRef.current) / 1000);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result.split(',')[1];
          if (base64Data) {
            handleSendMessage('', true, base64Data, finalMime, durationSec);
          }
        };

        streamRef.current?.getTracks().forEach(t => t.stop());
      });

      mediaRecorder.start(250); // 250ms timeslice — the core fix
      recStartRef.current = Date.now();

      // Live timer
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => {
        setRecSeconds(s => s + 1);
      }, 1000);

      // Enforce minimum 1-second before user can stop
      setCanStop(false);
      canStopTimerRef.current = setTimeout(() => setCanStop(true), MIN_RECORDING_MS);

      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      if (err.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        alert(`Error: ${err.message}`);
      }
    }
  };

  // ── Recording: stop ──────────────────────────────────────────────────────────
  const stopRecording = () => {
    if (!canStop) return; // enforce minimum duration
    clearInterval(recTimerRef.current);
    clearTimeout(canStopTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecSeconds(0);
  };

  // ── Text submit ──────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRecording) { stopRecording(); return; }
    handleSendMessage(inputText, false);
  };

  // ── CTA navigation ───────────────────────────────────────────────────────────
  const handleCTA = (cta) => {
    if (cta && onNavigate) onNavigate(cta.tab, null);
  };

  // ── Format bold markdown ─────────────────────────────────────────────────────
  const formatText = (text) =>
    text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <div className={`drawer-backdrop ${isOpen ? 'visible' : ''}`} onClick={onClose} />

      <div className={`chat-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-agent-info">
            <div className="drawer-agent-avatar">
              <img src={xchangeCoreImg} alt="Xchange Core" />
              <div className="online-dot" />
            </div>
            <div>
              <h3>Xchange Core</h3>
              <p className="agent-status-text" style={{ justifyContent: 'flex-start', marginTop: 2 }}>
                <ShieldCheck size={13} />&nbsp;Ipê Passport Sync
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={22} /></button>
        </div>

        {/* Messages */}
        <div className="drawer-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.role}`}>
              <div className="message-bubble-wrap">
                <div
                  className={`message-bubble ${msg.role}${msg.isAudio ? ' audio-bubble' : ''}`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                />
                {msg.role === 'agent' && msg.cta && (
                  <button className="chat-cta-btn" onClick={() => handleCTA(msg.cta)}>
                    <Zap size={14} />
                    {msg.cta.label}
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="message-wrapper agent">
              <div className="message-bubble agent typing-indicator">
                <Activity size={14} className="pulse-anim" /> Core is processing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="drawer-input-area">

          {/* Quick actions — horizontally scrollable */}
          {messages.length <= 1 && !isRecording && (
            <div className="quick-actions-row">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className="quick-action-chip"
                  onClick={() => handleSendMessage(action.prompt)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Recording state UI */}
          {isRecording && (
            <div className="recording-bar">
              <div className="sound-wave">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="rec-timer">{formatDuration(recSeconds)}</span>
              <button
                className={`stop-rec-btn ${canStop ? 'active' : 'waiting'}`}
                onClick={stopRecording}
                disabled={!canStop}
                title={canStop ? 'Stop recording' : 'Keep recording...'}
              >
                <Square size={16} fill="currentColor" />
                {canStop ? 'Stop' : 'Hold...'}
              </button>
            </div>
          )}

          {/* Text input row */}
          {!isRecording && (
            <form onSubmit={handleSubmit} className="input-form" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className={`mic-btn ${isRecording ? 'recording' : ''}`}
                onClick={startRecording}
                title="Record audio message"
              >
                <Mic size={20} />
              </button>
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="text-input"
              />
              <button type="submit" className="send-btn" disabled={!inputText.trim()}>
                <Send size={20} />
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatDrawer;

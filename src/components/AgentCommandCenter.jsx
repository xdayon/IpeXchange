import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Send, X, ShieldCheck, Activity, ArrowRight, Zap, Square, PackageCheck, Loader2, Brain, Database, Cpu, Network } from 'lucide-react';
import xchangeCoreImg from '../assets/xchange_core.png';
import personalAgentImg from '../assets/agent_bot.svg';
import { sendChatMessage, fetchSessionHistory, publishListing } from '../lib/api';
import { useUser } from '../lib/UserContext';

const SKILLS = [
  { label: 'Sell Item',        icon: <PackageCheck size={18} />, color: '#B4F44A', desc: 'List something new',          prompt: 'I want to sell something' },
  { label: 'Market Insight',   icon: <Activity size={18} />,  color: '#B4F44A', desc: 'Trending offers today',          prompt: "Show me what's trending in the city today" },
  { label: 'Price Estimator',  icon: <Zap size={18} />,       color: '#F59E0B', desc: 'Get fair value advice',           prompt: 'I need help pricing something I want to sell' },
  { label: 'Trade Finder',     icon: <ArrowRight size={18} />, color: '#38BDF8', desc: 'Suggest swap matches',            prompt: 'What interesting trades do you suggest for me?' },
  { label: 'Multi-Hop Loop',   icon: <Network size={18} />,   color: '#818CF8', desc: 'Deep liquidity search',           prompt: 'Search for circular multi-hop trade opportunities in the ecosystem' },
  { label: 'Knowledge Hub',    icon: <Brain size={18} />,     color: '#F472B6', desc: 'List your workshops',             prompt: 'I want to publish a course or workshop I teach' },
];

const MIN_RECORDING_MS = 1000;

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const AgentCommandCenter = ({ isOpen, onClose, onNavigate }) => {
  const { displayName, walletAddress } = useUser();

  const [sessionId, setSessionId]     = useState('');
  const [messages, setMessages]       = useState([]);
  const [inputText, setInputText]     = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping]       = useState(false);
  const [canStop, setCanStop]         = useState(false);
  const [recSeconds, setRecSeconds]   = useState(0);
  const [publishing, setPublishing]   = useState(null);
  const [showSkills, setShowSkills]   = useState(true);

  const messagesEndRef   = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef        = useRef(null);
  const audioChunksRef   = useRef([]);
  const recStartRef      = useRef(null);
  const recTimerRef      = useRef(null);
  const canStopTimerRef  = useRef(null);
  const inputRef         = useRef(null);

  useEffect(() => {
    if (messages.length > 1) setShowSkills(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    let sid = localStorage.getItem('ipeCoreSessionId');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('ipeCoreSessionId', sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(recTimerRef.current);
      clearTimeout(canStopTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (isOpen && sessionId) loadHistory();
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsTyping(true);
    const history = await fetchSessionHistory(sessionId);
    setIsTyping(false);
    if (history.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'agent',
        content: `Welcome to the **Command Center**. I am your Xchange Core agent. How can I assist your economic participation today?`,
        cta: null,
      }]);
    } else {
      setMessages(history);
      setShowSkills(false);
    }
  };

  const handleSendMessage = useCallback(async (text, isAudio = false, audioBase64 = null, mimeType = null, audioDuration = null) => {
    if (!text.trim() && !audioBase64) return;

    const displayContent = isAudio && !text.trim()
      ? `🎤 Voice message${audioDuration ? ` · ${formatDuration(audioDuration)}` : ''}`
      : text;

    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: displayContent, cta: null, isAudio }]);
    setInputText('');
    setIsTyping(true);
    setShowSkills(false);

    try {
      const response = await sendChatMessage(sessionId, text, isAudio, audioBase64, mimeType, walletAddress);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'agent',
        content: response.text,
        cta: response.cta,
        listingReady: response.listingReady,
        listingDraft: response.listingDraft,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: 'Connection error. Core node unreachable.',
        cta: null,
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, walletAddress]);

  const handlePublish = async (msgId, draft) => {
    setPublishing(msgId);
    // Enrich draft with user info
    const enrichedDraft = {
      ...draft,
      provider_name: displayName || walletAddress?.slice(0, 8) || 'Community Member',
    };
    const result = await publishListing(sessionId, enrichedDraft, walletAddress, displayName);
    if (result) {
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, listingDraft: null, listingPublished: true, publishedListingId: result.id } : m
      ));
    }
    setPublishing(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        if (audioBlob.size < 500) return;
        const durationSec = Math.round((Date.now() - recStartRef.current) / 1000);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result.split(',')[1];
          if (base64Data) handleSendMessage('', true, base64Data, mediaRecorder.mimeType, durationSec);
        };
        streamRef.current?.getTracks().forEach(t => t.stop());
      });

      mediaRecorder.start(250);
      recStartRef.current = Date.now();
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
      setCanStop(false);
      canStopTimerRef.current = setTimeout(() => setCanStop(true), MIN_RECORDING_MS);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (!canStop) return;
    clearInterval(recTimerRef.current);
    clearTimeout(canStopTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecSeconds(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRecording) { stopRecording(); return; }
    handleSendMessage(inputText, false);
  };

  const handleCTA = (cta) => {
    if (cta && onNavigate) {
      const params = (cta.tab === 'store-detail' && cta.storeId)
        ? { storeId: cta.storeId }
        : null;
      onNavigate(cta.tab, params);
      onClose();
    }
  };

  const formatText = (text) =>
    text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  if (!isOpen) return null;

  return (
    <div className="acc-overlay animate-fade-in">
      <div className="acc-panel glass-panel animate-scale-up">
        {/* Header */}
        <div className="acc-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={20} className="text-gradient-cyan" />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Core Command Center</h2>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, opacity: 0.8 }}>Powered by Xchange Core · ZKP secured</p>
            </div>
            <div className="status-badge" style={{ marginLeft: 10 }}>
              <div className="status-dot online" />
              <span>SYNCED</span>
            </div>
          </div>
          <button className="acc-close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="acc-main-grid">
          {/* Left Column: Agent HUD */}
          <div className="acc-hud">
            <div className="acc-avatar-wrap floating-animation">
              <img src={xchangeCoreImg} alt="Agent" className="acc-avatar" />
              <div className="acc-avatar-glow" />
            </div>
            <div className="acc-hud-stats">
              <div className="acc-hud-stat">
                <span className="label">Identity</span>
                <span className="value">{displayName || 'Anon'}</span>
              </div>
              <div className="acc-hud-stat">
                <span className="label">Status</span>
                <span className="value text-gradient-lime">ZKP Active</span>
              </div>
              <div className="acc-hud-stat">
                <span className="label">Memory</span>
                <span className="value">1.4 GB</span>
              </div>
              <div className="acc-hud-stat">
                <span className="label">Session</span>
                <span className="value" style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {sessionId ? sessionId.slice(0, 8) + '…' : '—'}
                </span>
              </div>
              <div className="acc-hud-stat">
                <span className="label">Network</span>
                <span className="value" style={{ color: '#B4F44A' }}>Ipê City</span>
              </div>
              <div className="acc-hud-stat">
                <span className="label">Msg Count</span>
                <span className="value">{messages.length}</span>
              </div>
            </div>
          </div>

          {/* Center Column: Chat Stream */}
          <div className="acc-stream-container">
            <div className="acc-stream">
              {messages.map((msg, i) => (
                <div key={i} className={`acc-msg-wrap ${msg.role}`}>
                  {msg.role === 'agent' && (
                    <div className="acc-msg-avatar">
                      <img src={xchangeCoreImg} alt="C" />
                    </div>
                  )}
                  <div className="acc-msg-content">
                    <div
                      className={`acc-msg-bubble ${msg.role}`}
                      dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                    />
                    {msg.role === 'agent' && msg.listingDraft && !msg.listingPublished && (
                      <div className="listing-draft-card glass-panel" style={{ marginTop: 12, padding: 16, border: '1px solid var(--accent-lime)' }}>
                        <p style={{ fontSize: 10, color: 'var(--accent-lime)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>
                          ✨ Listing Draft Ready
                        </p>
                        
                        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{msg.listingDraft.title}</h4>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          <span className="badge-cyan">{msg.listingDraft.category}</span>
                          {msg.listingDraft.subcategory && <span className="badge-secondary">{msg.listingDraft.subcategory}</span>}
                          {msg.listingDraft.condition && <span className="badge-secondary">{msg.listingDraft.condition}</span>}
                          {msg.listingDraft.price_fiat && <span className="badge-lime">${msg.listingDraft.price_fiat}</span>}
                          {msg.listingDraft.accepts_trade && <span className="badge-purple">Accepts Trade</span>}
                        </div>
                        
                        {msg.listingDraft.description && (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                            {msg.listingDraft.description.slice(0, 120)}{msg.listingDraft.description.length > 120 ? '…' : ''}
                          </p>
                        )}
                        
                        {msg.listingDraft.trade_wants && (
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                            🔄 Wants in trade: {msg.listingDraft.trade_wants}
                          </p>
                        )}
                        
                        {msg.listingDraft.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                            {msg.listingDraft.tags.map(tag => (
                              <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            className="checkout-cta" 
                            style={{ flex: 1, padding: '9px 12px', fontSize: 13 }}
                            onClick={() => handlePublish(msg.id, msg.listingDraft)}
                            disabled={publishing === msg.id}
                          >
                            {publishing === msg.id ? <Loader2 size={14} className="spin-animation" /> : <PackageCheck size={14} />}
                            Publish to Marketplace
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.role === 'agent' && msg.listingPublished && (
                      <div className="listing-published-banner" style={{ marginTop: 12 }}>
                        <PackageCheck size={14} />
                        Live in the marketplace!
                        <button className="listing-published-link" onClick={() => handleCTA({ tab: 'discover' })}>View in Discover →</button>
                      </div>
                    )}

                    {msg.role === 'agent' && msg.cta && !msg.listingReady && (
                      <button className="chat-cta-btn" onClick={() => handleCTA(msg.cta)}>
                        <Zap size={14} /> {msg.cta.label} <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="acc-msg-wrap agent">
                  <div className="acc-msg-avatar"><img src={xchangeCoreImg} alt="C" /></div>
                  <div className="acc-msg-bubble agent typing">
                    <Activity size={14} className="pulse-anim" /> Core is processing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Right Column: Skills Grid */}
          <div className={`acc-skills-panel ${showSkills ? 'visible' : ''}`}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} /> AGENT SKILLS
            </h4>
            <div className="acc-skills-grid">
              {SKILLS.map((skill) => (
                <button key={skill.label} className="acc-skill-card" onClick={() => handleSendMessage(skill.prompt)} disabled={isTyping}>
                  <div className="skill-icon" style={{ background: `${skill.color}15`, border: `1px solid ${skill.color}30` }}>
                    <span style={{ color: skill.color }}>{skill.icon}</span>
                  </div>
                  <div className="skill-info">
                    <span className="skill-label">{skill.label}</span>
                    <span className="skill-desc">{skill.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Unified Input */}
        <div className="acc-input-bar">
          {isRecording ? (
            <div className="acc-recording-area">
              <div className="acc-wave">
                {[...Array(20)].map((_, i) => <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.07}s` }} />)}
              </div>
              <span className="rec-timer">{formatDuration(recSeconds)}</span>
              <button className={`acc-stop-btn ${canStop ? 'active' : ''}`} onClick={stopRecording} disabled={!canStop}>
                <Square size={16} fill="currentColor" /> Stop
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="acc-form">
              <input
                ref={inputRef}
                type="text"
                placeholder="Issue a command or describe an intent..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="acc-input"
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="acc-action-btn" onClick={startRecording} title="Voice Command">
                  <Mic size={20} />
                </button>
                <button type="submit" className="acc-send-btn" disabled={!inputText.trim()} title="Send Command">
                  <Send size={20} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentCommandCenter;

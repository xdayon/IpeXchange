import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, ShieldCheck, Activity, ArrowRight, Zap } from 'lucide-react';
import xchangeCoreImg from '../assets/xchange_core.png';
import { sendChatMessage, fetchSessionHistory } from '../lib/api';

const QUICK_ACTIONS = [
  { label: '✨ Proactive Insight', prompt: 'Me mostre um insight proativo para mim hoje' },
  { label: '💰 Price item',        prompt: 'Preciso de ajuda para precificar um item que quero vender' },
  { label: '🔄 Suggest trades',    prompt: 'Sugira opções de trocas justas para mim' },
  { label: '🌐 Circular Trade',   prompt: 'Busque oportunidades de trocas multi-hop circulares no ecossistema' },
  { label: '📈 P2P Credit',       prompt: 'Quero saber sobre opções de crédito e investimento P2P' },
];

const ChatDrawer = ({ isOpen, onClose, onNavigate }) => {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  
  // Speech Recognition state
  const [recognition, setRecognition] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, interimTranscript]);

  // Init Session
  useEffect(() => {
    let sid = localStorage.getItem('ipeCoreSessionId');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('ipeCoreSessionId', sid);
    }
    setSessionId(sid);
  }, []);

  // Init Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'pt-BR'; // Default to Portuguese

      rec.onresult = (event) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interimStr);
        if (finalStr) {
          // Update input text with final results as they come in
          setInputText(prev => (prev + ' ' + finalStr).trim());
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        setWaveActive(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        setWaveActive(false);
        setInterimTranscript('');
      };

      setRecognition(rec);
    }
  }, []);

  // Reset/Load on open
  useEffect(() => {
    if (isOpen && sessionId) {
      loadHistory();
    }
  }, [isOpen, sessionId]);

  const loadHistory = async () => {
    setIsTyping(true);
    const history = await fetchSessionHistory(sessionId);
    setIsTyping(false);
    
    if (history.length === 0) {
      setMessages([{ 
        role: 'agent', 
        content: 'Olá! Eu sou o **Xchange Core**. Me diga o que você precisa ou o que está oferecendo — você pode me enviar um áudio!', 
        cta: null 
      }]);
    } else {
      setMessages(history);
    }
  };

  const handleSendMessage = async (text, isAudio = false) => {
    if (!text.trim()) return;
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: text, cta: null }]);
    setInputText('');
    setInterimTranscript('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(sessionId, text, isAudio);
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: response.text, 
        cta: response.cta 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: 'Desculpe, ocorreu um erro de conexão com o Core. Tente novamente.', 
        cta: null 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleMic = () => {
    if (!recognition) {
      alert('Seu navegador não suporta reconhecimento de voz (tente no Google Chrome).');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      setWaveActive(false);
      // Let onend event handle the rest, but if there's text, we can send it
      if (inputText.trim() || interimTranscript.trim()) {
        const finalMessage = (inputText + ' ' + interimTranscript).trim();
        if (finalMessage) {
          handleSendMessage(finalMessage, true);
        }
      }
    } else {
      setInputText('');
      setInterimTranscript('');
      try {
        recognition.start();
        setIsRecording(true);
        setWaveActive(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRecording && recognition) {
      recognition.stop();
    }
    handleSendMessage(inputText, false);
  };

  const handleCTA = (cta) => {
    if (!cta) return;
    if (onNavigate) {
      // Pass null params for now, routing logic will handle the tab switch
      onNavigate(cta.tab, null);
    }
  };

  const formatText = (text) =>
    text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  return (
    <>
      <div className={`drawer-backdrop ${isOpen ? 'visible' : ''}`} onClick={onClose} />

      <div className={`chat-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-agent-info">
            <div className="drawer-agent-avatar">
              <img src={xchangeCoreImg} alt="Xchange Core" />
              <div className="online-dot"></div>
            </div>
            <div>
              <h3>Xchange Core</h3>
              <p className="agent-status-text" style={{ justifyContent: 'flex-start', marginTop: 2 }}>
                <ShieldCheck size={13} /> &nbsp;Ipê Passport Sync
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={22} /></button>
        </div>

        <div className="drawer-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.role}`}>
              <div className="message-bubble-wrap">
                <div
                  className={`message-bubble ${msg.role}`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                />
                {msg.role === 'agent' && msg.cta && (
                  <button
                    className="chat-cta-btn"
                    onClick={() => handleCTA(msg.cta)}
                  >
                    <Zap size={14} />
                    {msg.cta.label}
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Show interim transcript when recording */}
          {interimTranscript && (
            <div className="message-wrapper user">
              <div className="message-bubble-wrap">
                <div className="message-bubble user" style={{ opacity: 0.7, fontStyle: 'italic' }}>
                  {inputText} {interimTranscript}
                </div>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="message-wrapper agent">
              <div className="message-bubble agent typing-indicator">
                <Activity size={14} className="pulse-anim" /> Core está processando...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="drawer-input-area">
          {waveActive && (
            <div className="sound-wave">
              {[...Array(7)].map((_, i) => (
               <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}

          <button
            id="mic-btn-main"
            className={`fab-mic ${isRecording ? 'recording' : ''}`}
            onClick={toggleMic}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <p className="mic-hint">
            {isRecording ? 'Ouvindo... toque para enviar' : 'Pressione para falar com o Core'}
          </p>

          {!isRecording && messages.length <= 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => handleSendMessage(action.prompt)}
                  style={{ fontSize: 12, padding: '7px 14px', borderRadius: 100, border: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="input-form" style={{ marginTop: '16px' }}>
            <input
              type="text"
              placeholder="Ou digite sua mensagem..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="text-input"
              disabled={isRecording}
            />
            <button type="submit" className="send-btn" disabled={!inputText.trim() && !interimTranscript.trim()}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatDrawer;

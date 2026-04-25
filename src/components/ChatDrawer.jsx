import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, ShieldCheck, Activity } from 'lucide-react';
import xchangeCoreImg from '../assets/xchange_core.png';

const DEMO_RESPONSES = {
  'macbook': 'Processando intent: **"comprar um Macbook"**. Usando ZKP para preservar sua identidade enquanto busco correspondências no grafo da cidade. Intent salvo no banco de dados da Xchange — vou monitorar e te notificar assim que encontrar uma oferta de outro cidadão.',
  'default': 'Recebi sua mensagem. Vou processar e cruzar com os dados disponíveis na cidade de Jurerê. Sua privacidade está protegida com Zero-Knowledge Proofs. Qualquer novidade, retorno imediatamente.',
};

const ChatDrawer = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Reset on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        setMessages([{ role: 'agent', content: 'Olá! Sou o **Xchange Core**. Fale o que você precisa ou está oferecendo — pode mandar um áudio!' }]);
      }, 400);
    }
  }, [isOpen]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const key = Object.keys(DEMO_RESPONSES).find(k => text.toLowerCase().includes(k)) || 'default';
      setMessages(prev => [...prev, { role: 'agent', content: DEMO_RESPONSES[key] }]);
    }, 2200);
  };

  const handleMic = () => {
    if (isRecording) return;
    setIsRecording(true);
    setWaveActive(true);
    setTimeout(() => {
      setIsRecording(false);
      setWaveActive(false);
      sendMessage('estou querendo comprar um macbook');
    }, 2500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText);
    setInputText('');
  };

  const formatText = (text) =>
    text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return (
    <>
      {/* Backdrop */}
      <div className={`drawer-backdrop ${isOpen ? 'visible' : ''}`} onClick={onClose} />

      {/* Drawer */}
      <div className={`chat-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-agent-info">
            <div className="drawer-agent-avatar">
              <img src={xchangeCoreImg} alt="Xchange Core" />
              <div className="online-dot"></div>
            </div>
            <div>
              <h3>Xchange Core</h3>
              <p className="agent-status-text" style={{ justifyContent: 'flex-start', marginTop: 2 }}>
                <ShieldCheck size={13} /> &nbsp;ZKP Privacy Active
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={22} /></button>
        </div>

        {/* Messages */}
        <div className="drawer-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.role}`}>
              <div
                className={`message-bubble ${msg.role}`}
                dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
              />
            </div>
          ))}
          {isTyping && (
            <div className="message-wrapper agent">
              <div className="message-bubble agent typing-indicator">
                <Activity size={14} className="pulse-anim" /> processando intent...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mic + Input */}
        <div className="drawer-input-area">
          {/* Sound wave animation */}
          {waveActive && (
            <div className="sound-wave">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}

          {/* Big mic button */}
          <button
            id="mic-btn-main"
            className={`fab-mic ${isRecording ? 'recording' : ''}`}
            onClick={handleMic}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <p className="mic-hint">
            {isRecording ? 'Ouvindo...' : 'Pressione para falar com o Core'}
          </p>

          {/* Text fallback */}
          <form onSubmit={handleSubmit} className="input-form" style={{ marginTop: '16px' }}>
            <input
              type="text"
              placeholder="Ou escreva sua mensagem..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="text-input"
            />
            <button type="submit" className="send-btn"><Send size={20} /></button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatDrawer;

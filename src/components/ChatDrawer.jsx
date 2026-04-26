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
  
  // Speech Recognition state replaced by MediaRecorder refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Init Session
  useEffect(() => {
    let sid = localStorage.getItem('ipeCoreSessionId');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('ipeCoreSessionId', sid);
    }
    setSessionId(sid);
  }, []);

  // Clean up media tracks on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
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

  const handleSendMessage = async (text, isAudio = false, audioBase64 = null, mimeType = null) => {
    if (!text.trim() && !audioBase64) return;
    
    // Add user message to UI immediately
    const displayContent = isAudio && !text.trim() ? '🎤 Áudio Enviado' : text;
    setMessages(prev => [...prev, { role: 'user', content: displayContent, cta: null }]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(sessionId, text, isAudio, audioBase64, mimeType);
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

  const startRecording = async () => {
    try {
      if (!window.MediaRecorder) {
        alert('Seu navegador não suporta gravação de áudio nativa. Por favor, atualize seu navegador.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      let options = {};
      if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Fallback to mp4 if mediaRecorder doesn't provide it
        const finalMimeType = mediaRecorder.mimeType || options.mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result.split(',')[1];
          if (base64Data) {
            handleSendMessage('', true, base64Data, finalMimeType);
          }
        };
        
        // Stop all audio tracks to turn off the microphone light
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setWaveActive(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      if (err.name === 'NotFoundError' || err.message.includes('Requested device not found')) {
        alert('Erro: Nenhum microfone encontrado. Conecte um microfone ao seu dispositivo e tente novamente.');
      } else {
        alert(`Erro: ${err.message || 'Falha ao acessar o microfone'}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setWaveActive(false);
  };

  const toggleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
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
            <button type="submit" className="send-btn" disabled={!inputText.trim()}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatDrawer;

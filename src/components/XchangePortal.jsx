import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, ShieldCheck, Activity } from 'lucide-react';
import xchangeCoreImg from '../assets/xchange_core.png';

const XchangePortal = () => {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentTyping]);

  const handleSimulateAudio = () => {
    if (isRecording) return;
    setIsRecording(true);
    
    // Simulate recording for 2 seconds
    setTimeout(() => {
      setIsRecording(false);
      handleUserMessage("estou querendo comprar um macbook");
    }, 2000);
  };

  const handleSubmitText = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleUserMessage(inputText);
    setInputText('');
  };

  const handleUserMessage = (text) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsAgentTyping(true);

    // Simulate Agent Processing
    setTimeout(() => {
      setIsAgentTyping(false);
      const agentResponse = `Processando sua intenção: "comprar um macbook". Estou utilizando provas de conhecimento zero (ZKP) para garantir que sua identidade permaneça privada enquanto busco correspondências no hub local. Armazenei esta informação no banco de dados da Xchange. Assim que encontrar uma oferta compatível de outro cidadão, irei notificá-lo imediatamente.`;
      setMessages(prev => [...prev, { role: 'agent', content: agentResponse }]);
    }, 2500);
  };

  return (
    <div className="portal-layout">
      {/* Agent Visual Area */}
      <div className="agent-display-area">
        <div className="agent-avatar-large floating-animation">
          <img src={xchangeCoreImg} alt="Xchange Core Agent" />
          <div className="agent-status-ring"></div>
        </div>
        <h2 className="text-gradient-cyan">Xchange Core</h2>
        <p className="agent-status-text">
          <ShieldCheck size={16} className="inline mr-1 text-lime" />
          ZKP Privacy Active
        </p>
      </div>

      {/* Chat Area */}
      <div className="chat-interface glass-panel">
        <div className="chat-messages">
          {messages.length === 0 && !isAgentTyping && (
            <div className="empty-chat text-center">
              <p>Hello. I am the Xchange Core. How can I assist you in the local economy today?</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-wrapper ${msg.role}`}>
              <div className={`message-bubble ${msg.role}`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {isAgentTyping && (
            <div className="message-wrapper agent">
              <div className="message-bubble agent typing-indicator">
                <Activity size={16} className="pulse-anim" /> Processing intent...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <form onSubmit={handleSubmitText} className="input-form">
            <button 
              type="button"
              className={`mic-btn ${isRecording ? 'recording pulse-red' : ''}`}
              onClick={handleSimulateAudio}
            >
              <Mic size={28} />
            </button>
            <input 
              type="text" 
              placeholder="Type or speak naturally..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="text-input"
            />
            <button type="submit" className="send-btn">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default XchangePortal;

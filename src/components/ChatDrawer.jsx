import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, ShieldCheck, Activity } from 'lucide-react';
import xchangeCoreImg from '../assets/xchange_core.png';

const DEMO_RESPONSES = {
  'macbook':    'Processando intent: **"comprar um Macbook"**. Usando ZKP para preservar sua identidade enquanto busco correspondências no grafo da cidade. Encontrei 1 oferta ativa de outro cidadão — vou te conectar com segurança.',
  'bicicleta':  '🚲 Analisando mercado de bicicletas em Jurerê... Encontrei 3 referências de preço:\n- Caloi E-Vibe (usada): R$ 3.800\n- Trek FX+ (nova): R$ 8.200\n- Oggi B.W 8.0 (estado similar ao seu): **R$ 3.900 – R$ 4.500** é um preço justo. Posso publicar sua oferta no City Graph agora.',
  'preço':      '💰 **Assistente de Precificação.** Me diga o que deseja vender ou trocar — envie uma descrição, foto ou áudio. Vou cruzar com transações similares no histórico do Xchange e te dar uma faixa de preço justa baseada em dados reais da cidade.',
  'troca':      '🔄 **Trocas Justas.** Analisando seu perfil e intents ativos... Encontrei 2 combinações interessantes:\n1. Seu design gráfico ↔ Mel Orgânico (Sítio Ipê) — 4h de design = 6 potes\n2. Seu design ↔ Sessão de fisioterapia (Dr. Sarah) — estimativa equilibrada segundo reputação de ambos\nQuer que eu proponha a troca?',
  'investimento': '📈 **Xchange Capital.** Seu reputation score (95) qualifica para crédito de até **R$ 12.000** com taxa a partir de 4.2% a.a. — muito abaixo do mercado tradicional. Segurança garantida por smart contracts na Ethereum. Quer iniciar o processo?',
  'emprego':    '👨‍💻 **Busca de Talentos.** Há 2 oportunidades ativas em Jurerê compatíveis com seu perfil:\n1. Web Developer – Ipê Hub (4.000 USDC/mês)\n2. Designer Web3 – Studio Creative (negociável)\nTambém posso cadastrar seu perfil como disponível na DB do Core.',
  'default':    'Recebi sua mensagem. Vou processar e cruzar com os dados disponíveis na cidade de Jurerê. Sua privacidade está protegida com Zero-Knowledge Proofs. Qualquer novidade, retorno imediatamente.',
};

const QUICK_ACTIONS = [
  { label: '💰 Precificar item',    prompt: 'quero saber o preço justo de algo que tenho para vender' },
  { label: '🔄 Sugerir trocas',    prompt: 'quero fazer uma troca justa com alguém da cidade' },
  { label: '📈 Crédito P2P',       prompt: 'quero saber sobre investimento e crédito disponível para mim' },
  { label: '👨‍💻 Buscar emprego',    prompt: 'quero encontrar oportunidades de emprego na cidade' },
];

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

          {/* Quick action chips */}
          {!isRecording && messages.length <= 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  style={{ fontSize: 12, padding: '7px 14px', borderRadius: 100, border: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

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

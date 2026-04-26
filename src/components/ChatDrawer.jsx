import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, ShieldCheck, Activity, ArrowRight, Zap } from 'lucide-react';
import xchangeCoreImg from '../assets/xchange_core.png';
import { mockListings } from '../data/mockData';

const DEMO_RESPONSES = {
  'macbook':    { text: 'Processing intent: **"buy a Macbook"**. Using your **Veritas Passport** to preserve your identity while searching for matches in the city graph. Found 1 active offer at **AI Haus** — I will connect you securely.', cta: { label: '⚡ Start Xchange', tab: 'checkout', params: { listing: { id: 'mock-mac', title: 'MacBook Pro M3 (2024)', provider: 'lucas.ipecity.eth', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: '$1,500', description: 'MacBook Pro M3 in excellent condition. Bought 6 months ago at Founder Haus. Box and all original accessories included. I accept USDC or RBTC.', category: 'Products', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&h=300' } } } },
  'bicycle':    { text: '🚲 Analyzing bicycle market in Jurerê... Found 3 references on the **Skill Exchange Board**:\n- Caloi E-Vibe (used): $700\n- Trek FX+ (new): $1,500\n- Oggi B.W 8.0 (similar condition to yours): **$750 – $850** is a fair price. I can publish your offer on the City Graph now.', cta: null },
  'bike':       { text: '🚲 Analyzing bicycle market in Jurerê... Found 3 references on the **Skill Exchange Board**:\n- Caloi E-Vibe (used): $700\n- Trek FX+ (new): $1,500\n- Oggi B.W 8.0 (similar condition to yours): **$750 – $850** is a fair price. I can publish your offer on the City Graph now.', cta: null },
  'price':      { text: '💰 **Pricing Assistant.** Tell me what you want to sell or trade — send a description, photo, or audio. I will cross-reference with similar transactions in the Veritas OS history and give you a fair price range based on real city data.', cta: null },
  'trade':      { text: '🔄 **Fair Trades.** Analyzing your profile and active intents... Found 2 interesting matches:\n1. Your graphic design ↔ Organic Honey (Sítio Ipê) — 4h design = 6 jars\n2. Your design ↔ Physical Therapy session at **Founder Haus** (Dr. Sarah) — balanced estimate according to both reputations\nWant me to propose the trade?', cta: { label: '🔄 View Trade Opportunity', tab: 'checkout', params: { listing: mockListings.find(l => l.id === 'l7') || mockListings[0] } } },
  'investment': { text: '📈 **Xchange Capital.** Your **Veritas Rep (95)** qualifies for credit up to **$2,500** with rates starting at 4.2% p.a. — much lower than the traditional market. Security guaranteed by smart contracts on **Rootstock**. Want to start the process?', cta: { label: '📈 View Investment Opportunities', tab: 'investments', params: null } },
  'buy':        { text: 'Found active offers in Discover that match what you are looking for. Which product or service do you want to acquire? I can search the City Graph with your privacy protected by ZKP and Veritas Passport.', cta: { label: '🧭 Explore on Discover', tab: 'discover', params: null } },
  'job':        { text: '👨‍💻 **Talent Search.** There are 2 active opportunities in Jurerê compatible with your profile:\n1. Web Developer – Ipê Hub (4,000 USDC/month)\n2. Web3 Designer – AI Haus (negotiable)\nI can also register your profile as available in the Core database.', cta: { label: '💼 View Opportunities', tab: 'investments', params: null } },
  'circular':   { text: '🔄 **Multi-hop Trade Match!** I analyzed the city network and found a perfect cycle for you in the **Veritas Marketplace**. You give your Electric Bike to Carlos, who gives Web Consulting to Bia, who gives you the Macbook Pro M1 you wanted. Perfect 3-way cycle!', cta: { label: '⚡ Sign Circular Contract', tab: 'circular', params: null } },
  'learn':      { text: '📚 **Knowledge Hub.** I see you want to learn something new. In Jurerê we have the **Founder Haus** offering woodworking workshops and João from Sítio Ipê offering **Sustainable Beekeeping Mentorship**. I can connect you with them on the Skill Exchange Board.', cta: { label: '🧠 View Learning Opportunities', tab: 'discover', params: null } },
  'teach':      { text: '🎓 **Share your Knowledge.** Excellent initiative! What would you like to teach? I can create a "Skill Offer" in your Veritas Passport and notify citizens with compatible interests.', cta: null },
  'need':       { text: '🚨 **Village Demands.** Currently, the network detects high scarcity of **Solar Panel Technicians** and **Artisan Bakers** in Jurerê. If you have these skills, your work will be highly valued in the ecosystem now. Want to see the full list of demands on the Home page?', cta: { label: '⚠️ View City Gaps', tab: 'home', params: null } },
  'health':     { text: '💡 **Proactive Insight.** You mentioned "health". Analyzing the City Graph, I noticed that Marina is selling an **E-Bike (City Cruiser)** near you and the **Runners Club** meets tomorrow at 6 AM. Want me to bridge the connection with them?', cta: { label: '🚴 View E-Bike Details', tab: 'discover', params: null } },
  'insight':    { text: '✨ **Proactive Insight.** Analyzing the City Graph, I noticed that Marina is selling an **E-Bike (City Cruiser)** near you and the **Runners Club** meets tomorrow at 6 AM. This aligns perfectly with your recent health goals. Want me to bridge the connection with them?', cta: { label: '🚴 View E-Bike Details', tab: 'discover', params: null } },
  'default':    { text: 'I received your message. I will process and cross-reference with available data in the Ipê ecosystem. Your privacy is protected with Zero-Knowledge Proofs and Veritas Passport. Any updates, I will return immediately.', cta: null },
};

const QUICK_ACTIONS = [
  { label: '✨ Proactive Insight', prompt: 'Show me my proactive insight' },
  { label: '💰 Price item',        prompt: 'I want to know the fair price of something I have to sell' },
  { label: '🔄 Suggest trades',    prompt: 'I want to make a fair trade with someone in the city' },
  { label: '🌐 Circular Trade',   prompt: 'look for circular trade opportunities for my items' },
  { label: '📈 P2P Credit',       prompt: 'I want to know about investment and credit available for me' },
];

const ChatDrawer = ({ isOpen, onClose, onNavigate }) => {
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
        setMessages([{ role: 'agent', content: 'Hello! I am **Xchange Core**. Tell me what you need or what you are offering — you can send an audio!', cta: null }]);
      }, 400);
    }
  }, [isOpen]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text, cta: null }]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const key = Object.keys(DEMO_RESPONSES).find(k => text.toLowerCase().includes(k)) || 'default';
      const response = DEMO_RESPONSES[key];
      setMessages(prev => [...prev, { role: 'agent', content: response.text, cta: response.cta }]);
    }, 2200);
  };

  const handleMic = () => {
    if (isRecording) return;
    setIsRecording(true);
    setWaveActive(true);
    setTimeout(() => {
      setIsRecording(false);
      setWaveActive(false);
      sendMessage('I want to buy a macbook');
    }, 2500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText);
    setInputText('');
  };

  const handleCTA = (cta) => {
    if (!cta) return;
    if (onNavigate) {
      onNavigate(cta.tab, cta.params);
    }
  };

  const formatText = (text) =>
    text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

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
                <ShieldCheck size={13} /> &nbsp;Veritas Passport Sync
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
                  className={`message-bubble ${msg.role}`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                />
                {/* Inline CTA button */}
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
                <Activity size={14} className="pulse-anim" /> processing intent...
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
            {isRecording ? 'Listening...' : 'Press to talk to Core'}
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
              placeholder="Or write your message..."
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

import React, { useState } from 'react';
import { Settings, Shield, Bell, Bot, Database, Eye, Globe, Sliders, Smartphone, Key, Network } from 'lucide-react';

const ConfigSection = ({ title, icon: Icon, children }) => (
  <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color: 'var(--text-primary)' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h3>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {children}
    </div>
  </div>
);

const ToggleRow = ({ label, description, defaultChecked = false, badge }) => {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{label}</p>
          {badge && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 100, border: `1px solid ${badge.color}30`, background: `${badge.color}10`, color: badge.color }}>{badge.text}</span>}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</p>
      </div>
      <button 
        onClick={() => setChecked(!checked)}
        style={{ 
          width: 44, height: 24, borderRadius: 100, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
          background: checked ? 'var(--accent-lime)' : 'rgba(255,255,255,0.1)', flexShrink: 0
        }}
      >
        <div style={{ 
          position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: '50%', 
          background: checked ? '#000' : '#fff', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
        }} />
      </button>
    </div>
  );
};

const SelectRow = ({ label, description, options, defaultValue }) => {
  const [value, setValue] = useState(defaultValue);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</p>
      </div>
      <select 
        value={value} onChange={e => setValue(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: 14 }}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
};

const ConfigPage = () => {
  return (
    <div className="inner-page container" style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>
          Configurações <span className="text-gradient-cyan">do Sistema</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Ajuste suas preferências de privacidade, comportamento do Core e parâmetros da rede Ipê.</p>
      </div>

      <ConfigSection title="Privacidade e Zero-Knowledge" icon={Shield}>
        <ToggleRow 
          label="Modo ZKP Estrito (Strict Mode)" 
          description="Obriga o uso de Zero-Knowledge Proofs para todas as interações financeiras, sem exceção. Omissão total de valores públicos."
          defaultChecked={true}
          badge={{ text: 'Recomendado', color: '#B4F44A' }}
        />
        <ToggleRow 
          label="Visibilidade no Web of Trust" 
          description="Permite que contatos de 2º grau vejam seu perfil de reputação (apenas score e categorias, sem histórico)."
          defaultChecked={true}
        />
        <ToggleRow 
          label="Sincronização EAS Automática" 
          description="Envia periodicamente suas proofs locais para o Ethereum Attestation Service."
          defaultChecked={true}
        />
      </ConfigSection>

      <ConfigSection title="Comportamento do Xchange Core" icon={Bot}>
        <SelectRow 
          label="Nível de Proatividade do Agente" 
          description="Define quão agressivamente o Core busca matches para seus intents ativos."
          options={[
            { value: 'low', label: 'Conservador (Apenas matches exatos)' },
            { value: 'medium', label: 'Equilibrado (Recomendado)' },
            { value: 'high', label: 'Proativo (Sugere alternativas e trocas)' }
          ]}
          defaultValue="medium"
        />
        <ToggleRow 
          label="Automação de Preços (Fair Pricing AI)" 
          description="Permite que o Core sugira automaticamente preços justos baseados na economia da cidade ao criar um intent."
          defaultChecked={true}
          badge={{ text: 'Novo', color: '#38BDF8' }}
        />
        <ToggleRow 
          label="Agente de Negociação Autônomo" 
          description="Permite que seu agente pessoal negocie valores (até 10% de margem) com outros agentes sem te interromper."
          defaultChecked={false}
        />
      </ConfigSection>

      <ConfigSection title="Notificações e Alertas" icon={Bell}>
        <ToggleRow 
          label="Matches de Alta Relevância" 
          description="Notifica instantaneamente quando um match perfeito (100% de compatibilidade) é encontrado."
          defaultChecked={true}
        />
        <ToggleRow 
          label="Alertas da Rede de Confiança" 
          description="Avisa quando pessoas na sua Web of Trust completam transações ou melhoram de reputação."
          defaultChecked={false}
        />
        <SelectRow 
          label="Frequência do Digest da Cidade" 
          description="Resumo de atividades econômicas e novas lojas em Jurerê."
          options={[
            { value: 'realtime', label: 'Tempo Real' },
            { value: 'daily', label: 'Diário' },
            { value: 'weekly', label: 'Semanal' },
            { value: 'never', label: 'Desativado' }
          ]}
          defaultValue="daily"
        />
      </ConfigSection>

      <ConfigSection title="Rede e Integrações" icon={Network}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Database size={20} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>City Graph Node</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Conectado a Jurerê (Latência: 12ms)</p>
            </div>
          </div>
          <button style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.1)' }}>Trocar Nó</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Key size={20} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Chaves ZKP Locais</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Armazenadas com segurança no enclave do dispositivo</p>
            </div>
          </div>
          <button style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'rgba(244,63,94,0.1)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.3)' }}>Regerar Chaves</button>
        </div>
      </ConfigSection>
      
      <div style={{ textAlign: 'center', marginTop: 40, marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ipê Xchange Core v1.4.2 — Build 8f7a91</p>
      </div>
    </div>
  );
};

export default ConfigPage;

import React, { useState } from 'react';
import { Bell, ShieldCheck, TrendingUp, Users, Zap, MessageCircle, Star, Check, Trash2 } from 'lucide-react';

const NOTIFICATIONS = [
  { id: 'n1', type: 'match',    unread: true,  time: '2m',  icon: Zap,          color: '#B4F44A', title: '3 matches para sua bicicleta!', desc: 'Encontramos 3 interessados no seu Oggi B.W 8.0. O Core pode conectar você agora.' },
  { id: 'n2', type: 'trust',   unread: true,  time: '14m', icon: Users,         color: '#38BDF8', title: 'Roberto fez negócio com Carlos', desc: 'Alguém da sua Web of Trust completou uma transação. Reputação atualizada.' },
  { id: 'n3', type: 'invest',  unread: true,  time: '1h',  icon: TrendingUp,    color: '#818CF8', title: 'Nova oportunidade de investimento', desc: 'Padaria do Ipê está captando R$ 45k a 4.2% a.a. — compatível com seu perfil.' },
  { id: 'n4', type: 'rep',     unread: false, time: '2h',  icon: Star,          color: '#F59E0B', title: 'Sua reputação subiu para 95!', desc: 'Parabéns! Você atingiu o nível Elite no Xchange. Novos benefícios desbloqueados.' },
  { id: 'n5', type: 'msg',     unread: false, time: '4h',  icon: MessageCircle, color: '#38BDF8', title: 'Mensagem do Xchange Core', desc: 'Detectei um serviço de encanamento disponível hoje em Jurerê — você tinha uma busca ativa.' },
  { id: 'n6', type: 'security',unread: false, time: '1d',  icon: ShieldCheck,   color: '#B4F44A', title: 'ZKP sync concluído', desc: '47 attestations sincronizadas com sucesso na Ethereum. Seu histórico está seguro.' },
  { id: 'n7', type: 'match',   unread: false, time: '2d',  icon: Zap,           color: '#B4F44A', title: 'Troca justa sugerida pelo Core', desc: 'Design gráfico ↔ 6 potes de mel orgânico. Marina aceitaria essa proposta.' },
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="inner-page container" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 26, marginBottom: 6 }}>
            Notificações
            {unreadCount > 0 && (
              <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(180,244,74,0.12)', border: '1px solid rgba(180,244,74,0.3)', color: '#B4F44A' }}>
                {unreadCount} novas
              </span>
            )}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Atualizações do Core, matches e atividades da sua rede.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-cyan)', background: 'none', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 100, padding: '7px 14px', cursor: 'pointer' }}>
            <Check size={13} /> Marcar todas como lidas
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifications.map(n => {
          const Icon = n.icon;
          return (
            <div key={n.id} className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, borderColor: n.unread ? `${n.color}30` : 'var(--border-color)', background: n.unread ? `${n.color}05` : undefined, transition: 'all 0.2s' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${n.color}12`, border: `1px solid ${n.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                <Icon size={18} style={{ color: n.color }} />
                {n.unread && <span style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: '50%', background: '#B4F44A', border: '2px solid var(--bg-primary)' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 14, fontWeight: n.unread ? 700 : 600 }}>{n.title}</p>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{n.time}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.desc}</p>
              </div>
              <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, opacity: 0.5, flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p>Nenhuma notificação no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

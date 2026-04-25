import React from 'react';
import { Wallet as WalletIcon, ArrowRightLeft, History } from 'lucide-react';

const Wallet = () => {
  return (
    <div className="container" style={{maxWidth: '800px', paddingTop: '40px'}}>
      
      {/* Balances */}
      <div className="glass-panel" style={{padding: '40px', marginBottom: '24px'}}>
        <div className="flex-between mb-2">
          <h2 style={{fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <WalletIcon size={24} color="var(--accent-lime)" /> My Wallet
          </h2>
          <span className="badge" style={{color: 'var(--accent-lime)', borderColor: 'var(--accent-lime)'}}>Connected: 0x71C...9A23</span>
        </div>
        
        <div style={{display: 'flex', gap: '24px', marginTop: '32px'}}>
          <div className="glass-panel" style={{flex: 1, padding: '24px', background: 'rgba(56, 189, 248, 0.05)'}}>
            <p style={{color: 'var(--text-secondary)', marginBottom: '8px'}}>USDC Balance</p>
            <h3 style={{fontSize: '32px'}}>$1,240.00</h3>
          </div>
          <div className="glass-panel" style={{flex: 1, padding: '24px', background: 'rgba(180, 244, 74, 0.05)'}}>
            <p style={{color: 'var(--text-secondary)', marginBottom: '8px'}}>ETH Balance</p>
            <h3 style={{fontSize: '32px'}}>0.45 ETH</h3>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-panel" style={{padding: '40px'}}>
        <h3 style={{fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <History size={20} color="var(--accent-cyan)" /> Recent Xchanges
        </h3>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div className="flex-between glass-panel" style={{padding: '16px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div className="btn-icon" style={{background: 'rgba(255,255,255,0.1)'}}><ArrowRightLeft size={16} /></div>
              <div>
                <h4 style={{marginBottom: '4px'}}>Paid Dr. Sarah Haus</h4>
                <p style={{color: 'var(--text-secondary)', fontSize: '12px'}}>Emergency Vet for Dogs</p>
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <h4 style={{color: '#F43F5E'}}>- 50 USDC</h4>
              <p style={{color: 'var(--text-secondary)', fontSize: '12px'}}>Today, 14:30</p>
            </div>
          </div>

          <div className="flex-between glass-panel" style={{padding: '16px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div className="btn-icon" style={{background: 'rgba(255,255,255,0.1)'}}><ArrowRightLeft size={16} /></div>
              <div>
                <h4 style={{marginBottom: '4px'}}>Received from Marina G.</h4>
                <p style={{color: 'var(--text-secondary)', fontSize: '12px'}}>HDMI Setup Help (Donation)</p>
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <h4 style={{color: 'var(--accent-lime)'}}>+ 10 USDC</h4>
              <p style={{color: 'var(--text-secondary)', fontSize: '12px'}}>Yesterday</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Wallet;

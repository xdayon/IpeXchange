import React from 'react';
import { Camera, Shield, Award, MapPin } from 'lucide-react';

const Profile = () => {
  return (
    <div className="container" style={{maxWidth: '800px', paddingTop: '40px'}}>
      <div className="glass-panel" style={{padding: '40px', display: 'flex', gap: '40px', flexDirection: 'column'}}>
        
        {/* Header */}
        <div className="flex-between" style={{alignItems: 'flex-start'}}>
          <div style={{display: 'flex', gap: '24px', alignItems: 'center'}}>
            <div className="glass-panel" style={{width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative'}}>
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200" alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              <div style={{position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', textAlign: 'center', padding: '4px'}}>
                <Camera size={14} />
              </div>
            </div>
            <div>
              <h2 style={{fontSize: '28px', marginBottom: '8px'}}>Alex M.</h2>
              <p style={{color: 'var(--text-secondary)'}}>Builder & Tech Helper in Ipê City</p>
            </div>
          </div>
          <button className="btn-primary">Edit Profile</button>
        </div>

        {/* Form Sections */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
          <div>
            <label style={{display: 'block', marginBottom: '8px', color: 'var(--text-secondary)'}}>Skills</label>
            <textarea className="glass-panel" style={{width: '100%', minHeight: '100px', padding: '16px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)'}} defaultValue="Software Development, Hardware Setup, Basic Networking" />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '8px', color: 'var(--text-secondary)'}}>Academic / Reputation</label>
            <div className="glass-panel" style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div className="flex-center" style={{justifyContent: 'flex-start', gap: '8px'}}>
                <Award size={18} color="var(--accent-lime)" /> <span>B.S. Computer Science (Verified)</span>
              </div>
              <div className="flex-center" style={{justifyContent: 'flex-start', gap: '8px'}}>
                <Award size={18} color="var(--accent-cyan)" /> <span>15 Successful Xchanges</span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div style={{marginTop: '20px'}}>
          <h3 style={{fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Shield size={20} color="var(--accent-cyan)" /> Privacy Settings
          </h3>
          
          <div className="glass-panel flex-between" style={{padding: '20px'}}>
            <div>
              <h4 style={{marginBottom: '4px'}}>Show exact location on CityMap</h4>
              <p style={{color: 'var(--text-secondary)', fontSize: '14px'}}>If disabled, your items will only appear in the listings, protecting your home address.</p>
            </div>
            <div style={{background: 'var(--accent-lime)', width: '48px', height: '24px', borderRadius: '12px', position: 'relative', cursor: 'pointer'}}>
              <div style={{width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px'}}></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;

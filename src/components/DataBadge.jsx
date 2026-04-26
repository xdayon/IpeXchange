import React from 'react';
import { Database, Bot } from 'lucide-react';

const DataBadge = ({ isMock, style = {} }) => {
  if (isMock) {
    return (
      <span 
        title="This is simulated data for demonstration purposes"
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 4, 
          background: 'rgba(168, 85, 247, 0.1)', 
          border: '1px solid rgba(168, 85, 247, 0.3)', 
          color: '#c084fc', 
          padding: '2px 8px', 
          borderRadius: 100, 
          fontSize: 10, 
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          ...style
        }}
      >
        <Bot size={10} /> Simulated
      </span>
    );
  }

  return (
    <span 
      title="This is real data created by a user"
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 4, 
        background: 'rgba(34, 197, 94, 0.1)', 
        border: '1px solid rgba(34, 197, 94, 0.3)', 
        color: '#4ade80', 
        padding: '2px 8px', 
        borderRadius: 100, 
        fontSize: 10, 
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        ...style
      }}
    >
      <Database size={10} /> Real Data
    </span>
  );
};

export default DataBadge;

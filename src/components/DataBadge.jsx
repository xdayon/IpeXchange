import React from 'react';
import { Bot } from 'lucide-react';

const DataBadge = ({ isMock, style = {} }) => {
  if (isMock) {
    return (
      <span
        title="Simulated data for demonstration purposes"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(168, 85, 247, 0.12)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          color: '#c084fc',
          padding: '2px 8px',
          borderRadius: 100,
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          ...style,
        }}
      >
        <Bot size={10} /> Simulated
      </span>
    );
  }

  return (
    <span
      title="Real listing created by a city resident"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'rgba(180, 244, 74, 0.12)',
        border: '1px solid rgba(180, 244, 74, 0.4)',
        color: '#B4F44A',
        padding: '2px 9px',
        borderRadius: 100,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        ...style,
      }}
    >
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#B4F44A',
        boxShadow: '0 0 6px #B4F44A',
        animation: 'subtle-pulse 1.5s ease-in-out infinite',
        flexShrink: 0,
      }} />
      Live
    </span>
  );
};

export default DataBadge;

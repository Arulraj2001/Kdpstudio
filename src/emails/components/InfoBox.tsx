import React from 'react';

export interface InfoBoxProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

const BOX_STYLES = {
  info: {
    borderLeft: '4px solid #3b82f6',
    backgroundColor: '#eff6ff',
    color: '#1e3a8a',
  },
  success: {
    borderLeft: '4px solid #22c55e',
    backgroundColor: '#f0fdf4',
    color: '#14532d',
  },
  warning: {
    borderLeft: '4px solid #f59e0b',
    backgroundColor: '#fffbeb',
    color: '#78350f',
  },
  error: {
    borderLeft: '4px solid #ef4444',
    backgroundColor: '#fef2f2',
    color: '#7f1d1d',
  },
};

export const InfoBox: React.FC<InfoBoxProps> = ({ type = 'info', children }) => {
  const style = BOX_STYLES[type] || BOX_STYLES.info;

  return (
    <div
      style={{
        borderLeft: style.borderLeft,
        backgroundColor: style.backgroundColor,
        color: style.color,
        padding: '16px 20px',
        borderRadius: '8px',
        margin: '20px 0',
        fontSize: '14px',
        lineHeight: '1.6',
      }}
    >
      {children}
    </div>
  );
};

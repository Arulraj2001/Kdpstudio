import React from 'react';

export interface HeadingProps {
  children: React.ReactNode;
  size?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center';
}

export const Heading: React.FC<HeadingProps> = ({
  children,
  size = 'h1',
  align = 'left',
}) => {
  const styles: Record<string, React.CSSProperties> = {
    h1: {
      fontSize: '24px',
      fontWeight: 800,
      color: '#0f172a',
      letterSpacing: '-0.5px',
      margin: '0 0 16px 0',
      lineHeight: '1.3',
    },
    h2: {
      fontSize: '18px',
      fontWeight: 700,
      color: '#0f172a',
      letterSpacing: '-0.3px',
      margin: '20px 0 12px 0',
      lineHeight: '1.4',
    },
    h3: {
      fontSize: '15px',
      fontWeight: 700,
      color: '#334155',
      margin: '16px 0 8px 0',
      lineHeight: '1.4',
    },
  };

  const chosenStyle = {
    ...styles[size],
    textAlign: align,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  return <div style={chosenStyle}>{children}</div>;
};

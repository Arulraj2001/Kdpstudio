import React from 'react';

export interface ButtonProps {
  href: string;
  children: React.ReactNode;
  color?: string; // default purple #7c3aed
  textColor?: string;
  align?: 'left' | 'center' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  href,
  children,
  color = '#7c3aed',
  textColor = '#ffffff',
  align = 'left',
}) => {
  return (
    <table
      role="presentation"
      cellPadding="0"
      cellSpacing="0"
      border={0}
      style={{
        margin: align === 'center' ? '24px auto' : align === 'right' ? '24px 0 24px auto' : '24px 0',
      }}
    >
      <tr>
        <td
          align="center"
          style={{
            borderRadius: '8px',
            backgroundColor: color,
          }}
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              backgroundColor: color,
              color: textColor,
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '8px',
              letterSpacing: '-0.2px',
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </table>
  );
};

import React from 'react';

export interface KeyValueProps {
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
}

export const KeyValue: React.FC<KeyValueProps> = ({ label, value, isLast = false }) => {
  return (
    <table
      role="presentation"
      cellPadding="0"
      cellSpacing="0"
      border={0}
      width="100%"
      style={{
        borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
        padding: '10px 0',
      }}
    >
      <tr>
        <td
          style={{
            color: '#64748b',
            fontSize: '13px',
            fontWeight: 500,
            paddingRight: '12px',
            verticalAlign: 'top',
            width: '40%',
          }}
        >
          {label}
        </td>
        <td
          style={{
            color: '#0f172a',
            fontSize: '13px',
            fontWeight: 600,
            textAlign: 'right',
            verticalAlign: 'top',
          }}
        >
          {value}
        </td>
      </tr>
    </table>
  );
};

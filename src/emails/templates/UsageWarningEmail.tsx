import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { UsageWarningEmailData } from '../../types/email';

export interface UsageWarningEmailProps extends UsageWarningEmailData {
  unsubscribeUrl?: string;
}

export const UsageWarningEmail: React.FC<UsageWarningEmailProps> = ({
  name,
  feature,
  used,
  limit,
  percentage,
  resetTime = 'Midnight UTC (5:30 AM IST)',
  upgradeUrl,
  unsubscribeUrl,
}) => {
  const remaining = Math.max(0, limit - used);
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <BaseTemplate
      subject={`You're at ${clampedPercentage}% of your daily limit`}
      preheader={`${used} of ${limit} ${feature} used today`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You can adjust or disable daily limit alert emails in your notification settings."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        📊
      </div>

      <Heading size="h1" align="center">Daily Limit Warning</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
        Hi {name}, you've used <strong>{used}</strong> of your <strong>{limit}</strong> daily <strong>{feature}</strong> on KDP Studio today ({clampedPercentage}%).
      </p>

      {/* Visual Email-Safe Progress Bar */}
      <table
        role="presentation"
        cellPadding="0"
        cellSpacing="0"
        border={0}
        width="100%"
        style={{
          backgroundColor: '#f1f5f9',
          borderRadius: '8px',
          overflow: 'hidden',
          margin: '20px 0 10px 0',
          height: '24px',
        }}
      >
        <tr>
          <td
            style={{
              width: `${clampedPercentage}%`,
              backgroundColor: clampedPercentage > 90 ? '#ef4444' : '#f59e0b',
              textAlign: 'center',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              lineHeight: '24px',
            }}
          >
            {clampedPercentage >= 15 ? `${clampedPercentage}%` : ''}
          </td>
          <td
            style={{
              width: `${100 - clampedPercentage}%`,
              backgroundColor: '#e2e8f0',
            }}
          />
        </tr>
      </table>

      <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ marginBottom: '20px' }}>
        <tr>
          <td style={{ fontSize: '13px', color: '#64748b', textAlign: 'left' }}>
            <strong>{used}</strong> used · <strong>{remaining}</strong> remaining
          </td>
          <td style={{ fontSize: '13px', color: '#64748b', textAlign: 'right' }}>
            Resets at: <strong>{resetTime}</strong>
          </td>
        </tr>
      </table>

      <InfoBox type="warning">
        <strong>⏰ Heads up:</strong> When you reach 100% of your daily quota, AI actions will pause until midnight UTC.
      </InfoBox>

      <div style={{ textAlign: 'center', margin: '28px 0 16px 0' }}>
        <Button href={upgradeUrl} color="#7c3aed" align="center">
          Upgrade for Unlimited →
        </Button>
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
          Or wait — your limit resets every day at midnight UTC.<br />
          You can toggle usage warning emails anytime in your email settings.
        </p>
      </div>
    </BaseTemplate>
  );
};

export default UsageWarningEmail;

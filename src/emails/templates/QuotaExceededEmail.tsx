import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { QuotaExceededEmailData } from '../../types/email';

export interface QuotaExceededEmailProps extends QuotaExceededEmailData {
  unsubscribeUrl?: string;
}

export const QuotaExceededEmail: React.FC<QuotaExceededEmailProps> = ({
  name,
  feature,
  limit,
  currentPlan = 'Free',
  resetTime = 'Midnight UTC (5:30 AM IST)',
  upgradeUrl,
  unsubscribeUrl,
}) => {
  return (
    <BaseTemplate
      subject="Daily limit reached — upgrade for more"
      preheader={`Your ${feature} limit is full for today`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="Daily quotas prevent server overload and help keep KDP Studio affordable."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '40px' }}>
        🚫
      </div>

      <Heading size="h1" align="center">You've Hit Your Daily Limit</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6', textAlign: 'center' }}>
        Hi {name}, you've used all <strong>{limit} {feature}</strong> available on your <strong>{currentPlan}</strong> plan today.
      </p>

      <InfoBox type="info">
        <strong>🔄 Your limit resets at: {resetTime}</strong>
        <div style={{ marginTop: '4px', fontSize: '13px' }}>
          You can continue writing and exporting in KDP Studio as soon as your quota refreshes.
        </div>
      </InfoBox>

      <Heading size="h2">Want more right now?</Heading>

      {/* Side-by-Side Table Layout for Email Clients */}
      <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: '20px 0' }}>
        <tr>
          {/* Option 1: Wait */}
          <td
            style={{
              width: '48%',
              verticalAlign: 'top',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '6px' }}>
              Option 1: Wait (Free)
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              Your limit refreshes automatically at midnight UTC. No action needed.
            </div>
          </td>

          {/* Spacer */}
          <td style={{ width: '4%' }} />

          {/* Option 2: Upgrade */}
          <td
            style={{
              width: '48%',
              verticalAlign: 'top',
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#6b21a8', marginBottom: '6px' }}>
              Option 2: Upgrade
            </div>
            <div style={{ fontSize: '13px', color: '#7e22ce', lineHeight: '1.5' }}>
              Get unlimited {feature}, cover art generation, and priority rendering.
            </div>
          </td>
        </tr>
      </table>

      <div style={{ textAlign: 'center', margin: '24px 0 16px 0' }}>
        <Button href={upgradeUrl} color="#7c3aed" align="center">
          Upgrade Now →
        </Button>
      </div>
    </BaseTemplate>
  );
};

export default QuotaExceededEmail;

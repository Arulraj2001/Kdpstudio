import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { VerifyEmailData } from '../../types/email';

export interface VerifyEmailProps extends VerifyEmailData {
  unsubscribeUrl?: string;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({
  name,
  verificationUrl,
  unsubscribeUrl,
}) => {
  return (
    <BaseTemplate
      subject="Verify your email address"
      preheader="One click to complete your KDP Studio signup"
      unsubscribeUrl={unsubscribeUrl}
      footerNote="If you didn't create an account with KDP Studio, you can safely disregard this email."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        ✉️
      </div>

      <Heading size="h1" align="center">Verify Your Email</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
        Hi {name}, thanks for signing up for KDP Studio. Click the button below to verify your email address and activate your account.
      </p>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={verificationUrl} color="#7c3aed" align="center">
          Verify My Email Address
        </Button>
      </div>

      <InfoBox type="warning">
        <strong>⏰ This link expires in 24 hours.</strong> If you didn't create an account, ignore this email.
      </InfoBox>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748b' }}>
          Or paste this link into your browser:
        </p>
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#475569',
            wordBreak: 'break-all',
          }}
        >
          {verificationUrl}
        </div>
      </div>
    </BaseTemplate>
  );
};

export default VerifyEmail;

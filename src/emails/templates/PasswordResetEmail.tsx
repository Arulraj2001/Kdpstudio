import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { PasswordResetEmailData } from '../../types/email';

export interface PasswordResetEmailProps extends PasswordResetEmailData {
  unsubscribeUrl?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  name,
  resetUrl,
  expiresInMinutes = 30,
  unsubscribeUrl,
}) => {
  return (
    <BaseTemplate
      subject="Reset your KDP Studio password"
      preheader={`Your password reset link — expires in ${expiresInMinutes} minutes`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="For security reasons, this link can only be used once."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        🔑
      </div>

      <Heading size="h1" align="center">Reset Your Password</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
        We received a request to reset the password for your KDP Studio account ({name}). Click below to choose a new password.
      </p>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={resetUrl} color="#7c3aed" align="center">
          Reset My Password
        </Button>
      </div>

      <InfoBox type="warning">
        <strong>⏰ This link expires in {expiresInMinutes} minutes.</strong> After that, you'll need to request a new one.
      </InfoBox>

      <Divider />

      <InfoBox type="info">
        <strong>🔒 Didn't request this? Your account is safe.</strong> Someone may have entered your email by mistake. You can safely ignore this email.
      </InfoBox>
    </BaseTemplate>
  );
};

export default PasswordResetEmail;

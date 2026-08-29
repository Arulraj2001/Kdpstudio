import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { BmacReceivedEmailData } from '../../types/email';

export interface BmacReceivedEmailProps extends BmacReceivedEmailData {
  unsubscribeUrl?: string;
}

export const BmacReceivedEmail: React.FC<BmacReceivedEmailProps> = ({
  name,
  reward,
  credits,
  plan,
  unsubscribeUrl,
}) => {
  return (
    <BaseTemplate
      subject="Thanks for your support ☕"
      preheader={reward ? `${reward} has been added to your account` : 'Thank you for supporting KDP Studio!'}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="Buy Me a Coffee Supporter Perks."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '40px' }}>
        ☕
      </div>

      <Heading size="h1" align="center">Thank You for Your Support!</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6', textAlign: 'center' }}>
        Hi {name}, thank you so much for supporting KDP Studio. It genuinely means the world to our indie developer team!
      </p>

      <InfoBox type="success">
        {credits ? (
          <strong>✅ {credits} bonus AI credits added to your account!</strong>
        ) : plan ? (
          <strong>✅ {plan.toUpperCase()} plan activated on your account!</strong>
        ) : (
          <strong>✅ {reward || 'Bonus perks unlocked on your account!'}</strong>
        )}
      </InfoBox>

      <p style={{ margin: '20px 0', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
        Your support helps us maintain high-speed Gemini AI servers, develop new KDP layout engines, and continue making professional book publishing tools accessible for self-publishers worldwide.
      </p>

      <div style={{ textAlign: 'center', margin: '28px 0 16px 0' }}>
        <Button href={`${APP_URL}/dashboard`} color="#7c3aed" align="center">
          See What's New →
        </Button>
      </div>
    </BaseTemplate>
  );
};

export default BmacReceivedEmail;

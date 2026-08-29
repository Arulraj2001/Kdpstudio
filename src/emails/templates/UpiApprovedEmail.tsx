import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { UpiApprovedEmailData } from '../../types/email';

export interface UpiApprovedEmailProps extends UpiApprovedEmailData {
  unsubscribeUrl?: string;
}

export const UpiApprovedEmail: React.FC<UpiApprovedEmailProps> = ({
  name,
  plan,
  activeUntil,
  unsubscribeUrl,
}) => {
  const normalizedPlan = (plan || 'pro').toLowerCase();
  const formattedPlan = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <BaseTemplate
      subject={`Payment verified — ${formattedPlan} plan activated ✅`}
      preheader="Your account has been upgraded!"
      unsubscribeUrl={unsubscribeUrl}
      footerNote="UPI receipt verified by KDP Studio."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '40px' }}>
        ✅
      </div>

      <Heading size="h1" align="center">Payment Verified!</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6', textAlign: 'center' }}>
        Great news, {name}! Your UPI payment has been verified and your <strong>{formattedPlan}</strong> plan is now active.
      </p>

      <InfoBox type="success">
        <strong>🎉 Your {formattedPlan} plan is active</strong>
        <div style={{ marginTop: '4px', fontSize: '13px' }}>
          {activeUntil ? `Valid until: ${activeUntil}` : 'Lifetime access unlocked'}
        </div>
      </InfoBox>

      <Heading size="h2">What's now unlocked for you:</Heading>

      <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: '16px 0' }}>
        {normalizedPlan.includes('starter') && (
          <>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>20 AI generations</strong> per day</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>10 PDF exports</strong> per day</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>EPUB export</strong> with full styling</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Puzzle book generator</strong> (Sudoku, Mazes)</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Watermark-free</strong> commercial exports</td></tr>
          </>
        )}

        {normalizedPlan.includes('agency') && (
          <>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Everything in Pro</strong> included</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>3 team seats</strong> & collaboration</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Bulk book generator</strong></td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>White-label exports</strong></td></tr>
          </>
        )}

        {!normalizedPlan.includes('starter') && !normalizedPlan.includes('agency') && (
          <>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Unlimited AI writing</strong> & chapter generation</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Unlimited PDF & EPUB exports</strong></td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>AI cover image generation</strong> (300 DPI)</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>AI book translator</strong> (12 languages)</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>KDP Niche research & keyword tool</strong></td></tr>
          </>
        )}
      </table>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Button href={`${APP_URL}/dashboard`} color="#7c3aed" align="center">
          Explore Your New Features →
        </Button>
      </div>
    </BaseTemplate>
  );
};

export default UpiApprovedEmail;

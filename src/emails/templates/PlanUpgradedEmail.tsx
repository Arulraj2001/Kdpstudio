import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import { KeyValue } from '../components/KeyValue';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { PlanUpgradedEmailData } from '../../types/email';

export interface PlanUpgradedEmailProps extends PlanUpgradedEmailData {
  unsubscribeUrl?: string;
}

export const PlanUpgradedEmail: React.FC<PlanUpgradedEmailProps> = ({
  name,
  plan,
  billingCycle,
  amount,
  currency,
  gateway,
  planEndDate,
  unsubscribeUrl,
}) => {
  const normalizedPlan = (plan || 'pro').toLowerCase();
  const formattedPlan = plan.charAt(0).toUpperCase() + plan.slice(1);
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <BaseTemplate
      subject={`Your ${formattedPlan} plan is now active 🚀`}
      preheader={`Welcome to ${formattedPlan} — here's what's unlocked`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="This email acts as your official invoice receipt for tax and business records."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '40px' }}>
        🚀
      </div>

      <Heading size="h1" align="center">You're now on {formattedPlan}!</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6', textAlign: 'center' }}>
        Hi {name}, your payment was successful and your account has been upgraded. Here's your receipt:
      </p>

      {/* Payment Receipt Box */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '20px 0',
        }}
      >
        <KeyValue label="Plan" value={`${formattedPlan} (${billingCycle || 'monthly'})`} />
        <KeyValue label="Amount Paid" value={`${currency || 'USD'} ${amount}`} />
        <KeyValue label="Payment Gateway" value={gateway} />
        <KeyValue label="Access Period" value={planEndDate || 'Active / Lifetime'} />
        <KeyValue label="Date" value={today} isLast />
      </div>

      <Divider />

      <Heading size="h2">What's now unlocked for you:</Heading>

      <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: '16px 0' }}>
        {normalizedPlan.includes('starter') && (
          <>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>20 AI generations</strong> per day</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>10 PDF exports</strong> per day</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>EPUB export</strong> with full styling</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Puzzle book generator</strong> (Sudoku, Mazes, Word Search)</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Brand kit</strong> and custom presets</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Watermark-free</strong> commercial exports</td></tr>
          </>
        )}

        {normalizedPlan.includes('agency') && (
          <>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Everything in Pro</strong> plan included</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>3 team seats</strong> & client management</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Bulk book generator</strong> (series & low-content)</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>White-label exports</strong> and client reports</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Dedicated VIP support</strong> & account manager</td></tr>
          </>
        )}

        {!normalizedPlan.includes('starter') && !normalizedPlan.includes('agency') && (
          // Default Pro
          <>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Unlimited AI writing</strong> & chapter expansion</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Unlimited PDF & EPUB exports</strong></td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>AI cover image generation</strong> (300 DPI)</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>AI book translator</strong> (12 languages)</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>KDP Niche research tool</strong> with keyword competition</td></tr>
            <tr><td style={{ padding: '4px 0', fontSize: '14px', color: '#334155' }}>✅ <strong>Priority fast-lane support</strong></td></tr>
          </>
        )}
      </table>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Button href={`${APP_URL}/dashboard`} color="#7c3aed" align="center">
          Go to Your Dashboard →
        </Button>
        <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Questions? Reply directly to this email and we'll help you get started.
        </p>
      </div>
    </BaseTemplate>
  );
};

export default PlanUpgradedEmail;

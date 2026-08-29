import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { KeyValue } from '../components/KeyValue';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { UpiSubmittedEmailData } from '../../types/email';

export interface UpiSubmittedEmailProps extends UpiSubmittedEmailData {
  unsubscribeUrl?: string;
}

export const UpiSubmittedEmail: React.FC<UpiSubmittedEmailProps> = ({
  name,
  plan,
  amount,
  utrNumber,
  submittedAt,
  estimatedTime = '2-4 hours',
  unsubscribeUrl,
}) => {
  const formattedPlan = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <BaseTemplate
      subject="UPI payment received — verifying now 🕐"
      preheader="We'll email you once verified (2-4 hours)"
      unsubscribeUrl={unsubscribeUrl}
      footerNote="UPI manual verification by KDP Studio Finance Operations."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        🕐
      </div>

      <Heading size="h1" align="center">Payment Submitted!</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6', textAlign: 'center' }}>
        Hi {name}, we've received your UPI payment details for the <strong>{formattedPlan}</strong> plan.
      </p>

      {/* Payment Details Box */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '20px 0',
        }}
      >
        <KeyValue label="Plan" value={formattedPlan} />
        <KeyValue label="Amount" value={`₹${amount}`} />
        <KeyValue label="UTR / Ref Number" value={utrNumber} />
        <KeyValue label="Submitted At" value={submittedAt} />
        <KeyValue label="Estimated Verification" value={estimatedTime} isLast />
      </div>

      <InfoBox type="info">
        <strong>💡 Verification Timeline:</strong> Verification usually takes 2-4 hours during business hours (9 AM – 6 PM IST, Monday–Saturday). Payments submitted on weekends are verified on Monday morning.
      </InfoBox>

      <p style={{ margin: '20px 0 16px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
        You can continue using KDP Studio on your current plan while we verify your transaction. We'll automatically email you once your upgraded features are ready!
      </p>

      <div style={{ textAlign: 'center', margin: '24px 0 8px 0' }}>
        <Button href={`${APP_URL}/dashboard`} color="#7c3aed" align="center">
          Go to Dashboard →
        </Button>
      </div>
    </BaseTemplate>
  );
};

export default UpiSubmittedEmail;

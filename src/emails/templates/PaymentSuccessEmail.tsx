import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { KeyValue } from '../components/KeyValue';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { PaymentSuccessEmailData } from '../../types/email';

export interface PaymentSuccessEmailProps extends PaymentSuccessEmailData {
  unsubscribeUrl?: string;
}

export const PaymentSuccessEmail: React.FC<PaymentSuccessEmailProps> = ({
  name,
  plan,
  amount,
  currency,
  invoiceUrl,
  paymentId,
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  unsubscribeUrl,
}) => {
  const formattedPlan = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <BaseTemplate
      subject="Payment Receipt — KDP Studio"
      preheader={`Receipt for your ${formattedPlan} plan purchase`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="Thank you for your business. Please save this email as proof of payment."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        🧾
      </div>

      <Heading size="h1" align="center">Payment Receipt</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6', textAlign: 'center' }}>
        Hi {name}, we received your payment for the <strong>{formattedPlan}</strong> plan.
      </p>

      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '20px 0',
        }}
      >
        <KeyValue label="Plan Name" value={formattedPlan} />
        <KeyValue label="Amount Paid" value={`${currency || 'USD'} ${amount}`} />
        <KeyValue label="Transaction ID" value={paymentId} />
        <KeyValue label="Date" value={date} isLast />
      </div>

      <div style={{ textAlign: 'center', margin: '28px 0 16px 0' }}>
        {invoiceUrl ? (
          <Button href={invoiceUrl} color="#7c3aed" align="center">
            Download Invoice PDF →
          </Button>
        ) : (
          <Button href={`${APP_URL}/dashboard`} color="#7c3aed" align="center">
            Go to Dashboard →
          </Button>
        )}
      </div>
    </BaseTemplate>
  );
};

export default PaymentSuccessEmail;

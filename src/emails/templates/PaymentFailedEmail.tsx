import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { PaymentFailedEmailData } from '../../types/email';

export interface PaymentFailedEmailProps extends PaymentFailedEmailData {
  unsubscribeUrl?: string;
}

export const PaymentFailedEmail: React.FC<PaymentFailedEmailProps> = ({
  name,
  plan,
  amount,
  gateway,
  retryUrl,
  unsubscribeUrl,
}) => {
  const formattedPlan = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <BaseTemplate
      subject="Action needed — payment failed"
      preheader="Update your payment method to keep your plan"
      unsubscribeUrl={unsubscribeUrl}
      footerNote="If you have questions regarding this billing attempt, our support team is standing by."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        ❌
      </div>

      <Heading size="h1" align="center">Payment Failed</Heading>

      <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
        Hi {name}, we were unable to process your subscription renewal of <strong>{amount}</strong> for your <strong>{formattedPlan}</strong> plan via {gateway}.
      </p>

      <InfoBox type="error">
        <strong>⚠️ Grace Period Active:</strong> Your plan will be automatically downgraded to Free if payment is not resolved within 7 days.
      </InfoBox>

      <Heading size="h2">What to do:</Heading>

      <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: '12px 0 20px 0' }}>
        <tr>
          <td style={{ verticalAlign: 'top', padding: '6px 0', fontSize: '14px', color: '#334155' }}>
            <strong>1. Check your account balance:</strong> Ensure your card or account has sufficient funds for this transaction.
          </td>
        </tr>
        <tr>
          <td style={{ verticalAlign: 'top', padding: '6px 0', fontSize: '14px', color: '#334155' }}>
            <strong>2. Update your payment details:</strong> Add a new credit/debit card or alternative payment method.
          </td>
        </tr>
        <tr>
          <td style={{ verticalAlign: 'top', padding: '6px 0', fontSize: '14px', color: '#334155' }}>
            <strong>3. Contact your bank:</strong> Some banks require authorization for international or recurring SaaS payments.
          </td>
        </tr>
      </table>

      <div style={{ textAlign: 'center', margin: '28px 0 16px 0' }}>
        <Button href={retryUrl} color="#dc2626" align="center">
          Update Payment Method →
        </Button>
        <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Need help? Reply directly to this email and we'll assist right away.
        </p>
      </div>
    </BaseTemplate>
  );
};

export default PaymentFailedEmail;

import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { UpiRejectedEmailData } from '../../types/email';

export interface UpiRejectedEmailProps extends UpiRejectedEmailData {
  unsubscribeUrl?: string;
}

export const UpiRejectedEmail: React.FC<UpiRejectedEmailProps> = ({
  name,
  plan,
  amount,
  reason,
  supportEmail = 'support@kdpstudio.com',
  unsubscribeUrl,
}) => {
  const formattedPlan = plan.charAt(0).toUpperCase() + plan.slice(1);
  const lowerReason = (reason || '').toLowerCase();

  return (
    <BaseTemplate
      subject="Payment could not be verified"
      preheader="Here's why and what to do next"
      unsubscribeUrl={unsubscribeUrl}
      footerNote="For assistance with bank reconciliation, contact our billing desk."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        ⚠️
      </div>

      <Heading size="h1" align="center">Payment Verification Failed</Heading>

      <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
        Hi {name}, unfortunately we were unable to verify your UPI payment of <strong>₹{amount}</strong> for the <strong>{formattedPlan}</strong> plan.
      </p>

      <InfoBox type="error">
        <strong>Reason for rejection:</strong>
        <div style={{ marginTop: '4px', fontSize: '14px' }}>
          {reason || 'UTR number could not be matched against bank records.'}
        </div>
      </InfoBox>

      <Heading size="h2">What to do next:</Heading>

      <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: '12px 0 20px 0' }}>
        {lowerReason.includes('utr') ? (
          <tr>
            <td style={{ verticalAlign: 'top', padding: '6px 0', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
              <strong>• Double-check the UTR number:</strong><br />
              - The UTR is the 12-digit reference number from Google Pay, PhonePe, or Paytm.<br />
              - Resubmit your request on the pricing page with the correct 12-digit number.
            </td>
          </tr>
        ) : lowerReason.includes('amount') ? (
          <tr>
            <td style={{ verticalAlign: 'top', padding: '6px 0', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
              <strong>• Check the payment amount:</strong><br />
              - The transferred amount did not match ₹{amount}.<br />
              - If you made a partial transfer, please complete the balance and email our support team.
            </td>
          </tr>
        ) : (
          <tr>
            <td style={{ verticalAlign: 'top', padding: '6px 0', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
              <strong>• Contact support with payment screenshot:</strong><br />
              - Email us at <a href={`mailto:${supportEmail}`} style={{ color: '#7c3aed' }}>{supportEmail}</a> with your payment screenshot.<br />
              - We will manually locate your transaction and activate your plan within 24 hours.
            </td>
          </tr>
        )}
      </table>

      <div style={{ textAlign: 'center', margin: '28px 0 16px 0' }}>
        <Button href={`${APP_URL}/pricing`} color="#7c3aed" align="center">
          Try Again →
        </Button>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748b' }}>
          Need help? Email us directly at <a href={`mailto:${supportEmail}`} style={{ color: '#7c3aed', textDecoration: 'underline' }}>{supportEmail}</a>
        </p>
      </div>
    </BaseTemplate>
  );
};

export default UpiRejectedEmail;

import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { PlanCancelledEmailData } from '../../types/email';

export interface PlanCancelledEmailProps extends PlanCancelledEmailData {
  unsubscribeUrl?: string;
}

export const PlanCancelledEmail: React.FC<PlanCancelledEmailProps> = ({
  name,
  plan,
  effectiveDate,
  unsubscribeUrl,
}) => {
  const formattedPlan = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <BaseTemplate
      subject="Your subscription has been cancelled"
      preheader={`Your ${formattedPlan} plan has been cancelled`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You won't be charged again unless you choose to reactivate."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        👋
      </div>

      <Heading size="h1" align="center">Subscription Cancelled</Heading>

      <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
        Hi {name}, your <strong>{formattedPlan}</strong> subscription has been successfully cancelled.
      </p>

      <InfoBox type="info">
        <strong>Access remains active:</strong> You will retain full access to all {formattedPlan} features until <strong>{effectiveDate}</strong>. After this date, your account will smoothly transition to the Free plan.
      </InfoBox>

      <p style={{ margin: '16px 0', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
        All your books, custom formatting presets, and cover art remain permanently saved in your account. You can reactivate anytime whenever you have your next book launch.
      </p>

      <div style={{ textAlign: 'center', margin: '28px 0 16px 0' }}>
        <Button href={`${APP_URL}/pricing`} color="#7c3aed" align="center">
          Reactivate Anytime →
        </Button>
      </div>
    </BaseTemplate>
  );
};

export default PlanCancelledEmail;

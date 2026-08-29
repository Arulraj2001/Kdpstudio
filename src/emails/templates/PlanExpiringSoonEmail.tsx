import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { PlanExpiringSoonEmailData } from '../../types/email';

export interface PlanExpiringSoonEmailProps extends PlanExpiringSoonEmailData {
  unsubscribeUrl?: string;
}

export const PlanExpiringSoonEmail: React.FC<PlanExpiringSoonEmailProps> = ({
  name,
  plan,
  daysLeft,
  expiresOn,
  renewUrl,
  unsubscribeUrl,
}) => {
  const formattedPlan = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <BaseTemplate
      subject={`Your ${formattedPlan} plan expires in ${daysLeft} days`}
      preheader="Renew now to keep your features and books"
      unsubscribeUrl={unsubscribeUrl}
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        ⚠️
      </div>

      <Heading size="h1" align="center">Your Plan Is Expiring Soon</Heading>

      <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
        Hi {name}, your <strong>{formattedPlan}</strong> plan expires on <strong>{expiresOn}</strong> ({daysLeft} {daysLeft === 1 ? 'day' : 'days'} left). After that, your account will be moved to the Free plan with limited daily capabilities.
      </p>

      <InfoBox type="warning">
        <strong style={{ display: 'block', marginBottom: '6px' }}>What changes on the Free plan:</strong>
        <ul style={{ margin: '0', paddingLeft: '18px', lineHeight: '1.6' }}>
          <li>AI generations reduced to 3/day</li>
          <li>PDF exports reduced to 1/day</li>
          <li>No AI cover image generation</li>
          <li>No EPUB export</li>
          <li>Basic KDP trim sizes only</li>
        </ul>
      </InfoBox>

      <p style={{ margin: '16px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
        <strong>🔒 Your books and data are always safe</strong> — we never delete your saved content, draft manuscripts, or generated covers.
      </p>

      <div style={{ textAlign: 'center', margin: '28px 0 16px 0' }}>
        <Button href={renewUrl} color="#7c3aed" align="center">
          Renew My Plan →
        </Button>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
          Cancel anytime — no long-term commitment.
        </p>
      </div>
    </BaseTemplate>
  );
};

export default PlanExpiringSoonEmail;

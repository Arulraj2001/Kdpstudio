import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { KeyValue } from '../components/KeyValue';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { AdminNewPaymentData } from '../../types/email';

export interface AdminNewPaymentEmailProps extends AdminNewPaymentData {
  unsubscribeUrl?: string;
}

export const AdminNewPaymentEmail: React.FC<AdminNewPaymentEmailProps> = ({
  userEmail,
  plan,
  amount,
  gateway,
  country = 'Global',
  timestamp = new Date().toLocaleString(),
  unsubscribeUrl,
}) => {
  return (
    <BaseTemplate
      subject={`[Admin] New payment: ${amount} from ${userEmail}`}
      preheader={`New ${plan} upgrade via ${gateway}`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="Internal KDP Studio Billing Alert."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        💰
      </div>

      <Heading size="h1">New Paid Upgrade</Heading>

      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '20px 0',
        }}
      >
        <KeyValue label="User Email" value={userEmail} />
        <KeyValue label="Plan" value={plan.toUpperCase()} />
        <KeyValue label="Amount" value={amount} />
        <KeyValue label="Gateway" value={gateway} />
        <KeyValue label="Country" value={country} />
        <KeyValue label="Timestamp" value={timestamp} isLast />
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0 8px 0' }}>
        <Button href={`${APP_URL}/admin`} color="#0f172a" align="center">
          Open Admin Panel →
        </Button>
      </div>
    </BaseTemplate>
  );
};

export default AdminNewPaymentEmail;

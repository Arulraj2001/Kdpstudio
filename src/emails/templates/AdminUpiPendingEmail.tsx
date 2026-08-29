import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { KeyValue } from '../components/KeyValue';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { AdminUpiPendingData } from '../../types/email';

export interface AdminUpiPendingEmailProps extends AdminUpiPendingData {
  unsubscribeUrl?: string;
}

export const AdminUpiPendingEmail: React.FC<AdminUpiPendingEmailProps> = ({
  userEmail,
  plan,
  amount,
  utrNumber,
  submittedAt = new Date().toLocaleString(),
  unsubscribeUrl,
}) => {
  return (
    <BaseTemplate
      subject="[Admin] UPI payment pending approval"
      preheader={`Pending UTR: ${utrNumber} (${plan.toUpperCase()} ₹${amount})`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="Action required: verify UTR against bank statement and approve/reject in admin panel."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        ⏳
      </div>

      <Heading size="h1">UPI Payment Pending Approval</Heading>

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
        <KeyValue label="Target Plan" value={plan.toUpperCase()} />
        <KeyValue label="Expected Amount" value={`₹${amount}`} />
        <KeyValue label="Submitted UTR" value={utrNumber} />
        <KeyValue label="Submitted At" value={submittedAt} isLast />
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0 8px 0' }}>
        <Button href={`${APP_URL}/admin`} color="#7c3aed" align="center">
          Review & Approve in Admin →
        </Button>
      </div>
    </BaseTemplate>
  );
};

export default AdminUpiPendingEmail;

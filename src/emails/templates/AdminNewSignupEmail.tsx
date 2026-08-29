import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { KeyValue } from '../components/KeyValue';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { AdminNewSignupData } from '../../types/email';

export interface AdminNewSignupEmailProps extends AdminNewSignupData {
  unsubscribeUrl?: string;
}

export const AdminNewSignupEmail: React.FC<AdminNewSignupEmailProps> = ({
  userEmail,
  userName = 'New Author',
  country = 'Global',
  currency = 'USD',
  signupMethod = 'Email',
  timestamp = new Date().toLocaleString(),
  unsubscribeUrl,
}) => {
  return (
    <BaseTemplate
      subject={`[Admin] New signup: ${userEmail}`}
      preheader={`New user from ${country}`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="Internal KDP Studio Administrator Alert."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        👤
      </div>

      <Heading size="h1">New User Signup</Heading>

      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '20px 0',
        }}
      >
        <KeyValue label="User Name" value={userName} />
        <KeyValue label="Email Address" value={userEmail} />
        <KeyValue label="Detected Country" value={country} />
        <KeyValue label="Currency" value={currency} />
        <KeyValue label="Signup Method" value={signupMethod} />
        <KeyValue label="Signup Time" value={timestamp} isLast />
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0 8px 0' }}>
        <Button href={`${APP_URL}/admin`} color="#0f172a" align="center">
          View in Admin →
        </Button>
      </div>
    </BaseTemplate>
  );
};

export default AdminNewSignupEmail;

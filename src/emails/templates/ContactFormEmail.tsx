import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { KeyValue } from '../components/KeyValue';
import { Heading } from '../components/Heading';
import { ContactFormEmailData } from '../../types/email';

export interface ContactFormEmailProps extends ContactFormEmailData {
  unsubscribeUrl?: string;
}

export const ContactFormEmail: React.FC<ContactFormEmailProps> = ({
  fromName,
  fromEmail,
  subject,
  message,
  timestamp = new Date().toLocaleString(),
  unsubscribeUrl,
}) => {
  return (
    <BaseTemplate
      subject={`New contact: ${subject} from ${fromName}`}
      preheader={`New support request from ${fromEmail}`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="Internal Notification · Sent from KDP Studio Helpdesk System."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '36px' }}>
        📬
      </div>

      <Heading size="h1">New Contact Form Submission</Heading>

      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '20px 0',
        }}
      >
        <KeyValue label="From Name" value={fromName} />
        <KeyValue label="Sender Email" value={fromEmail} />
        <KeyValue label="Subject" value={subject} />
        <KeyValue label="Received" value={timestamp} isLast />
      </div>

      <Heading size="h3">Message Content:</Heading>
      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '18px 20px',
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          fontSize: '13px',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          margin: '12px 0 24px 0',
        }}
      >
        {message}
      </div>

      <div style={{ textAlign: 'center', margin: '20px 0 8px 0' }}>
        <Button href={`mailto:${fromEmail}?subject=Re: ${encodeURIComponent(subject)}`} color="#7c3aed" align="center">
          Reply to {fromName} →
        </Button>
      </div>
    </BaseTemplate>
  );
};

export default ContactFormEmail;

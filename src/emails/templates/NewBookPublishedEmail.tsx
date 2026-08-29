import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { NewBookPublishedEmailData } from '../../types/email';

export interface NewBookPublishedEmailProps extends NewBookPublishedEmailData {
  unsubscribeUrl?: string;
}

export const NewBookPublishedEmail: React.FC<NewBookPublishedEmailProps> = ({
  name,
  bookTitle,
  trimSize = '6" x 9"',
  pageCount = 120,
  kdpUrl = 'https://kdp.amazon.com',
  unsubscribeUrl,
}) => {
  return (
    <BaseTemplate
      subject={`Congratulations! "${bookTitle}" is ready for KDP 🚀`}
      preheader="Your print-ready manuscript and cover spread are complete"
      unsubscribeUrl={unsubscribeUrl}
      footerNote="Ready to upload to your Amazon KDP dashboard."
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '40px' }}>
        📖
      </div>

      <Heading size="h1" align="center">Your Book is Ready for KDP!</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6', textAlign: 'center' }}>
        Congratulations {name}! You've finished formatting <strong>"{bookTitle}"</strong>.
      </p>

      <InfoBox type="success">
        <strong>✨ Print Package Specifications:</strong>
        <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '13px', lineHeight: '1.5' }}>
          <li>Trim Size: <strong>{trimSize}</strong></li>
          <li>Interior Page Count: <strong>{pageCount} pages</strong></li>
          <li>Interior PDF: Calibrated with required KDP gutter & margins</li>
          <li>Cover Spread PDF: Exact calculated spine width with bleed</li>
        </ul>
      </InfoBox>

      <div style={{ textAlign: 'center', margin: '28px 0 16px 0' }}>
        <Button href={kdpUrl} color="#ff9900" textColor="#111827" align="center">
          Upload on Amazon KDP →
        </Button>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
          Or open your <a href={`${APP_URL}/books`} style={{ color: '#7c3aed', textDecoration: 'underline' }}>KDP Studio Library</a>
        </p>
      </div>
    </BaseTemplate>
  );
};

export default NewBookPublishedEmail;

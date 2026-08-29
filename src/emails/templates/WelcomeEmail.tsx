import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import { InfoBox } from '../components/InfoBox';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { WelcomeEmailData } from '../../types/email';

export interface WelcomeEmailProps extends WelcomeEmailData {
  unsubscribeUrl?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name,
  verificationUrl,
  unsubscribeUrl,
}) => {
  const ctaUrl = verificationUrl || `${APP_URL}/studio`;

  return (
    <BaseTemplate
      subject="Welcome to KDP Studio! 🎉"
      preheader="Your AI-powered book publishing suite is ready"
      unsubscribeUrl={unsubscribeUrl}
    >
      <div style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '40px' }}>
        🎉
      </div>

      <Heading size="h1" align="center">Welcome, {name}!</Heading>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6', textAlign: 'center' }}>
        You've joined 10,000+ authors who use KDP Studio to create and publish books faster than ever before. Your free account is ready — no credit card needed.
      </p>

      <InfoBox type="success">
        <strong>✅ Your account is active on the Free plan</strong>
      </InfoBox>

      <Heading size="h2">What you can do right now:</Heading>

      <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: '16px 0' }}>
        <tr>
          <td style={{ verticalAlign: 'top', width: '36px', fontSize: '24px', paddingTop: '2px' }}>📝</td>
          <td style={{ verticalAlign: 'top', paddingLeft: '12px', paddingBottom: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginBottom: '3px' }}>
              Write with AI
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
              Describe your book idea and let Gemini AI write your chapters. Or type manually with our rich editor.
            </div>
          </td>
        </tr>

        <tr>
          <td style={{ verticalAlign: 'top', width: '36px', fontSize: '24px', paddingTop: '2px' }}>📐</td>
          <td style={{ verticalAlign: 'top', paddingLeft: '12px', paddingBottom: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginBottom: '3px' }}>
              Format for KDP
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
              Auto-calculate margins, spine width, and page layout. Export print-ready PDFs in any trim size.
            </div>
          </td>
        </tr>

        <tr>
          <td style={{ verticalAlign: 'top', width: '36px', fontSize: '24px', paddingTop: '2px' }}>🎨</td>
          <td style={{ verticalAlign: 'top', paddingLeft: '12px', paddingBottom: '8px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginBottom: '3px' }}>
              Design Your Cover
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
              Build a full cover spread with our canvas editor. Generate cover art with AI.
            </div>
          </td>
        </tr>
      </table>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Button href={ctaUrl} color="#7c3aed" align="center">
          Create Your First Book →
        </Button>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
          Or <a href={`${APP_URL}/dashboard`} style={{ color: '#7c3aed', textDecoration: 'underline' }}>explore the dashboard</a> to see all features
        </p>
      </div>

      <Divider />

      <table
        role="presentation"
        cellPadding="0"
        cellSpacing="0"
        border={0}
        width="100%"
        style={{
          backgroundColor: '#faf5ff',
          border: '1px solid #e9d5ff',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <tr>
          <td>
            <div style={{ fontSize: '13px', color: '#6b21a8', lineHeight: '1.6' }}>
              <strong>💡 Quick tip:</strong> Start with the Book Studio. Describe your book topic, pick a genre, and let AI generate your first chapter in under 60 seconds.
            </div>
          </td>
        </tr>
      </table>
    </BaseTemplate>
  );
};

export default WelcomeEmail;

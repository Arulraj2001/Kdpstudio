import React from 'react';
import { BaseTemplate } from '../components/BaseTemplate';
import { Divider } from '../components/Divider';
import { Heading } from '../components/Heading';
import { APP_URL } from '../../lib/resend';
import { WeeklyDigestEmailData } from '../../types/email';

export interface WeeklyDigestEmailProps extends WeeklyDigestEmailData {
  unsubscribeUrl?: string;
}

export const WeeklyDigestEmail: React.FC<WeeklyDigestEmailProps> = ({
  name,
  weekStart,
  weekEnd,
  booksCreated,
  aiGenerations,
  pdfsExported,
  currentPlan = 'Pro',
  tipTitle = 'How 7-Keyword Stacking Dominates Amazon KDP Search in 2026',
  tipBody = 'Amazon KDP indexing prioritizes long-tail phrases that combine niche reader intent with high commercial demand. Avoid repeating words from your book title in your 7 backend keyword slots to maximize unique index terms.',
  tipLink = `${APP_URL}/kdp`,
  unsubscribeUrl,
}) => {
  return (
    <BaseTemplate
      subject="Your KDP Studio week in review 📚"
      preheader={`${booksCreated} books · ${aiGenerations} AI generations this week`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You receive this weekly summary because you have active publishing activity on KDP Studio."
    >
      <div style={{ textAlign: 'center', margin: '0 0 12px 0', fontSize: '36px' }}>
        📚
      </div>

      <Heading size="h1" align="center">Your Week in Review</Heading>
      <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '-8px', marginBottom: '24px' }}>
        {weekStart} – {weekEnd}
      </div>

      <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
        Hi {name}, here is a look at what you created and accomplished this week in KDP Studio:
      </p>

      {/* 2x2 Stats Grid (Table-based for email compatibility) */}
      <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: '20px 0' }}>
        <tr>
          {/* Box 1 */}
          <td
            style={{
              width: '48%',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>📚</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{booksCreated}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>
              Books Created
            </div>
          </td>

          <td style={{ width: '4%' }} />

          {/* Box 2 */}
          <td
            style={{
              width: '48%',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🤖</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed' }}>{aiGenerations}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>
              AI Generations
            </div>
          </td>
        </tr>

        <tr><td style={{ height: '12px' }} colSpan={3} /></tr>

        <tr>
          {/* Box 3 */}
          <td
            style={{
              width: '48%',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>📄</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{pdfsExported}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>
              PDFs Exported
            </div>
          </td>

          <td style={{ width: '4%' }} />

          {/* Box 4 */}
          <td
            style={{
              width: '48%',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>⭐</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', lineHeight: '30px' }}>
              {currentPlan}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>
              Current Plan
            </div>
          </td>
        </tr>
      </table>

      <Divider />

      {/* Tip of the Week */}
      <Heading size="h2">💡 This Week's Publishing Tip</Heading>
      <div
        style={{
          backgroundColor: '#faf5ff',
          border: '1px solid #e9d5ff',
          borderRadius: '10px',
          padding: '18px 20px',
          margin: '16px 0',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#6b21a8', marginBottom: '6px' }}>
          {tipTitle}
        </div>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
          {tipBody}
        </p>
        <a
          href={tipLink}
          style={{
            color: '#7c3aed',
            fontWeight: 600,
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          Read more & explore keywords →
        </a>
      </div>

      <Divider />

      {/* Quick Actions Row */}
      <Heading size="h3" align="center">Quick Actions</Heading>
      <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: '16px 0' }}>
        <tr>
          <td align="center" style={{ padding: '0 4px' }}>
            <a
              href={`${APP_URL}/studio`}
              style={{
                display: 'inline-block',
                padding: '10px 14px',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              ✍️ Write a Book
            </a>
          </td>
          <td align="center" style={{ padding: '0 4px' }}>
            <a
              href={`${APP_URL}/cover`}
              style={{
                display: 'inline-block',
                padding: '10px 14px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              🎨 Design Cover
            </a>
          </td>
          <td align="center" style={{ padding: '0 4px' }}>
            <a
              href={`${APP_URL}/kdp`}
              style={{
                display: 'inline-block',
                padding: '10px 14px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              📊 KDP Metadata
            </a>
          </td>
        </tr>
      </table>
    </BaseTemplate>
  );
};

export default WeeklyDigestEmail;

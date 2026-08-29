import React from 'react';
import { APP_URL } from '../../lib/resend';

export interface BaseTemplateProps {
  subject: string;
  preheader: string;
  children: React.ReactNode;
  unsubscribeUrl?: string;
  footerNote?: string;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  subject,
  preheader,
  children,
  unsubscribeUrl,
  footerNote,
}) => {
  const defaultUnsub = unsubscribeUrl || `${APP_URL}/api/email/unsubscribe`;
  const privacyUrl = `${APP_URL}/privacy`;
  const contactUrl = `${APP_URL}/contact`;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>{subject}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#f4f4f5',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: '#1e293b',
          WebkitTextSizeAdjust: '100%',
        }}
      >
        {/* Invisible Preheader for Inbox Preview */}
        <span
          style={{
            display: 'none',
            maxHeight: 0,
            overflow: 'hidden',
            fontSize: '1px',
            lineHeight: '1px',
            maxWidth: 0,
            opacity: 0,
          }}
        >
          {preheader}
        </span>

        {/* Outer Email Wrapper */}
        <table
          role="presentation"
          cellPadding="0"
          cellSpacing="0"
          border={0}
          width="100%"
          style={{
            backgroundColor: '#f4f4f5',
            padding: '40px 16px',
            margin: 0,
          }}
        >
          <tr>
            <td align="center">
              {/* Centered Email Card (Max Width 600px) */}
              <table
                role="presentation"
                cellPadding="0"
                cellSpacing="0"
                border={0}
                width="100%"
                style={{
                  maxWidth: '600px',
                  margin: '0 auto',
                  borderCollapse: 'separate',
                }}
              >
                {/* ── Header ── */}
                <tr>
                  <td
                    style={{
                      backgroundColor: '#0f0f1a',
                      padding: '24px 32px',
                      borderRadius: '12px 12px 0 0',
                    }}
                  >
                    <table
                      role="presentation"
                      cellPadding="0"
                      cellSpacing="0"
                      border={0}
                      width="100%"
                    >
                      <tr>
                        <td align="left" style={{ verticalAlign: 'middle' }}>
                          <a
                            href={APP_URL}
                            style={{
                              textDecoration: 'none',
                              color: '#ffffff',
                            }}
                          >
                            <span
                              style={{
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '18px',
                                letterSpacing: '-0.5px',
                                display: 'block',
                              }}
                            >
                              KDP Studio
                            </span>
                            <span
                              style={{
                                color: '#a855f7',
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                display: 'block',
                                marginTop: '2px',
                              }}
                            >
                              PUBLISHING SUITE
                            </span>
                          </a>
                        </td>
                        <td
                          align="right"
                          style={{
                            verticalAlign: 'middle',
                            color: '#94a3b8',
                            fontSize: '12px',
                          }}
                        >
                          <a
                            href={APP_URL}
                            style={{
                              color: '#94a3b8',
                              textDecoration: 'none',
                              fontSize: '12px',
                            }}
                          >
                            kdpstudio.com
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* ── Content Area ── */}
                <tr>
                  <td
                    style={{
                      backgroundColor: '#ffffff',
                      padding: '32px',
                      borderLeft: '1px solid #e5e7eb',
                      borderRight: '1px solid #e5e7eb',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      color: '#334155',
                    }}
                  >
                    {children}
                  </td>
                </tr>

                {/* ── Footer ── */}
                <tr>
                  <td
                    style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderTop: 'none',
                      borderRadius: '0 0 12px 12px',
                      padding: '24px 32px',
                      textAlign: 'center',
                    }}
                  >
                    {footerNote && (
                      <p
                        style={{
                          margin: '0 0 12px 0',
                          fontSize: '12px',
                          color: '#64748b',
                          lineHeight: '1.5',
                        }}
                      >
                        {footerNote}
                      </p>
                    )}

                    <p
                      style={{
                        margin: '0 0 10px 0',
                        fontSize: '12px',
                        color: '#475569',
                        fontWeight: 600,
                      }}
                    >
                      © 2026 KDP Studio · Made in India 🇮🇳
                    </p>

                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        marginBottom: '10px',
                      }}
                    >
                      <a
                        href={defaultUnsub}
                        style={{
                          color: '#7c3aed',
                          textDecoration: 'underline',
                        }}
                      >
                        Unsubscribe / Preferences
                      </a>
                      <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                      <a
                        href={privacyUrl}
                        style={{
                          color: '#64748b',
                          textDecoration: 'underline',
                        }}
                      >
                        Privacy Policy
                      </a>
                      <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                      <a
                        href={contactUrl}
                        style={{
                          color: '#64748b',
                          textDecoration: 'underline',
                        }}
                      >
                        Help Center
                      </a>
                    </div>

                    <p
                      style={{
                        margin: '8px 0 0 0',
                        fontSize: '11px',
                        color: '#94a3b8',
                        lineHeight: '1.4',
                      }}
                    >
                      You received this email because you have an account or active publishing workspace at kdpstudio.com.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

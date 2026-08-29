import { verifyUnsubscribeToken } from '../../../../lib/emailService';
import { getAdminDb } from '../../../../lib/firebase-admin';

function renderPreferencesHtml(uid: string, token: string, prefs: { weeklyDigest: boolean; usageWarnings: boolean; marketing: boolean }, message = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Preferences — KDP Studio</title>
  <style>
    body {
      margin: 0;
      padding: 40px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 32px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #ffffff;
    }
    p.desc {
      font-size: 14px;
      color: #94a3b8;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }
    .msg {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 13px;
      font-weight: 500;
      background-color: #10b98120;
      border: 1px solid #10b98140;
      color: #34d399;
    }
    .option-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 28px;
    }
    .option {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      background-color: #0f172a80;
      border: 1px solid #33415560;
    }
    .option input {
      margin-top: 3px;
      cursor: pointer;
      accent-color: #7c3aed;
      width: 16px;
      height: 16px;
    }
    .option label {
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
      cursor: pointer;
      display: block;
    }
    .option .sub {
      font-size: 12px;
      font-weight: 400;
      color: #64748b;
      margin-top: 2px;
      display: block;
    }
    .option.disabled {
      opacity: 0.6;
      background-color: #0f172a40;
    }
    .option.disabled label {
      cursor: not-allowed;
    }
    .btn {
      width: 100%;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      color: #ffffff;
      border: none;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #a855f7;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
      <span style="font-weight: 800; color: #fff; font-size: 18px;">KDP Studio</span>
      <span style="color: #a855f7; font-size: 10px; font-weight: 700; background: #7c3aed20; padding: 2px 6px; border-radius: 4px; border: 1px solid #7c3aed40;">EMAIL PREFERENCES</span>
    </div>

    <h1>Notification Settings</h1>
    <p class="desc">Choose which updates and digests you'd like to receive in your inbox.</p>

    ${message ? `<div class="msg">✅ ${message}</div>` : ''}

    <form method="POST" action="/api/email/unsubscribe">
      <input type="hidden" name="uid" value="${uid}" />
      <input type="hidden" name="token" value="${token}" />

      <div class="option-group">
        <div class="option">
          <input type="checkbox" id="weeklyDigest" name="weeklyDigest" value="true" ${prefs.weeklyDigest ? 'checked' : ''} />
          <div>
            <label for="weeklyDigest">Weekly Publishing Digest</label>
            <span class="sub">Weekly summary of books created, AI tokens, and KDP publishing tips.</span>
          </div>
        </div>

        <div class="option">
          <input type="checkbox" id="usageWarnings" name="usageWarnings" value="true" ${prefs.usageWarnings ? 'checked' : ''} />
          <div>
            <label for="usageWarnings">Daily Limit & Quota Warnings</label>
            <span class="sub">Helpful alerts when approaching daily AI generation or export limits.</span>
          </div>
        </div>

        <div class="option">
          <input type="checkbox" id="marketing" name="marketing" value="true" ${prefs.marketing ? 'checked' : ''} />
          <div>
            <label for="marketing">Product Updates & Features</label>
            <span class="sub">New AI formatting tools, cover styles, and feature releases.</span>
          </div>
        </div>

        <div class="option disabled">
          <input type="checkbox" checked disabled />
          <div>
            <label>Billing & Transactional Receipts</label>
            <span class="sub">Invoices, subscription notices, and payment receipts (mandatory).</span>
          </div>
        </div>

        <div class="option disabled">
          <input type="checkbox" checked disabled />
          <div>
            <label>Security & Authentication</label>
            <span class="sub">Password resets, verification emails, and login security (mandatory).</span>
          </div>
        </div>
      </div>

      <button type="submit" class="btn">Save Preferences</button>
    </form>

    <div class="footer">
      <a href="/">Back to KDP Studio</a>
    </div>
  </div>
</body>
</html>`;
}

function renderErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invalid Link — KDP Studio</title>
  <style>
    body {
      margin: 0; padding: 40px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #0f172a; color: #f8fafc;
      display: flex; justify-content: center; align-items: center; min-height: 100vh;
    }
    .card {
      background: #1e293b; border: 1px solid #334155; border-radius: 16px;
      padding: 32px; max-width: 440px; width: 100%; text-align: center;
    }
    h1 { font-size: 20px; color: #ef4444; margin-bottom: 12px; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
    a { color: #a855f7; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚠️ Invalid Link</h1>
    <p>${message}</p>
    <a href="/">Return to KDP Studio Home</a>
  </div>
</body>
</html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid') || '';
  const token = url.searchParams.get('token') || '';

  if (!uid || !token || !verifyUnsubscribeToken(uid, token)) {
    return new Response(renderErrorHtml('This unsubscribe link is invalid or has expired.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Fetch current preferences if user exists
  let prefs = {
    weeklyDigest: true,
    usageWarnings: true,
    marketing: true,
  };

  try {
    const adminDb = getAdminDb();
    if (adminDb && uid !== 'guest') {
      const snap = await adminDb.collection('users').doc(uid).get();
      if (snap.exists) {
        const data = snap.data();
        if (data?.settings?.emailPreferences) {
          prefs = {
            weeklyDigest: data.settings.emailPreferences.weeklyDigest ?? true,
            usageWarnings: data.settings.emailPreferences.usageWarnings ?? true,
            marketing: data.settings.emailPreferences.marketing ?? true,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Error reading email preferences:', err);
  }

  return new Response(renderPreferencesHtml(uid, token, prefs), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(request: Request) {
  let uid = '';
  let token = '';
  let weeklyDigest = false;
  let usageWarnings = false;
  let marketing = false;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    uid = body.uid;
    token = body.token;
    weeklyDigest = Boolean(body.weeklyDigest);
    usageWarnings = Boolean(body.usageWarnings);
    marketing = Boolean(body.marketing);
  } else {
    const formData = await request.formData().catch(() => new FormData());
    uid = (formData.get('uid') as string) || '';
    token = (formData.get('token') as string) || '';
    weeklyDigest = formData.get('weeklyDigest') === 'true';
    usageWarnings = formData.get('usageWarnings') === 'true';
    marketing = formData.get('marketing') === 'true';
  }

  if (!uid || !token || !verifyUnsubscribeToken(uid, token)) {
    return new Response(renderErrorHtml('Invalid or expired verification token.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const newPreferences = {
    weeklyDigest,
    usageWarnings,
    marketing,
    billing: true,
    security: true,
  };

  try {
    const adminDb = getAdminDb();
    if (adminDb && uid !== 'guest') {
      await adminDb.collection('users').doc(uid).set(
        {
          settings: {
            emailPreferences: newPreferences,
            weeklyDigest,
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error('Failed saving email preferences:', err);
  }

  return new Response(
    renderPreferencesHtml(uid, token, { weeklyDigest, usageWarnings, marketing }, 'Your email preferences have been saved.'),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

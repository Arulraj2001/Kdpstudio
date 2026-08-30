/**
 * Newsletter Subscription & Campaign Dispatch Service
 * KDP Studio — Amazon KDP Self-Publishing Suite
 */

import { getAdminDb } from './firebase-admin';
import { NewsletterSubscriber, NewsletterConfig, BlogPost } from '../types/blog';
import { resend, EMAIL_FROM, APP_URL } from './resend';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

function generateRandomToken(len = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < len; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Subscribe a new user with Double Opt-In verification
 */
export async function subscribeToNewsletter(
  email: string,
  name: string | null = null,
  source = 'blog-footer',
  tags: string[] = []
): Promise<{ result: 'subscribed' | 'already_exists' | 'resubscribed'; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
    throw new Error('Please enter a valid email address');
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error('Database connection unavailable');
  }

  const subscribersRef = adminDb.collection('newsletterSubscribers');
  const existingSnap = await subscribersRef.where('email', '==', normalizedEmail).limit(1).get();

  const confirmToken = generateRandomToken(32);
  const now = new Date();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || APP_URL || 'https://kdpstudio-aio.web.app';
  const confirmUrl = `${baseUrl}/api/newsletter/confirm?token=${confirmToken}`;

  if (!existingSnap.empty) {
    const doc = existingSnap.docs[0];
    const data = doc.data();

    if (data.status === 'confirmed') {
      return {
        result: 'already_exists',
        message: "You're already subscribed to KDP Studio updates!",
      };
    }

    // Reactivate pending confirmation
    await doc.ref.update({
      status: 'pending',
      confirmToken,
      subscribedAt: now,
      source: source || data.source,
      tags: tags.length ? tags : data.tags || [],
    });

    await sendConfirmationEmail(normalizedEmail, name || data.name, confirmUrl, source);
    return {
      result: 'resubscribed',
      message: 'Please check your inbox to confirm your subscription!',
    };
  }

  // Create new pending subscriber
  await subscribersRef.add({
    email: normalizedEmail,
    name: name || null,
    status: 'pending',
    confirmToken,
    subscribedAt: now,
    confirmedAt: null,
    unsubscribedAt: null,
    source: source || 'blog-footer',
    tags: tags || [],
  });

  await sendConfirmationEmail(normalizedEmail, name, confirmUrl, source);

  return {
    result: 'subscribed',
    message: 'Verification link sent! Check your inbox to confirm your subscription.',
  };
}

/**
 * Confirm Double Opt-In subscription with token validation (7-day TTL)
 */
export async function confirmSubscription(
  token: string
): Promise<'confirmed' | 'not_found' | 'already_confirmed' | 'expired'> {
  if (!token) return 'not_found';

  const adminDb = getAdminDb();
  if (!adminDb) return 'not_found';

  const subscribersRef = adminDb.collection('newsletterSubscribers');
  const snap = await subscribersRef.where('confirmToken', '==', token).limit(1).get();

  if (snap.empty) {
    return 'not_found';
  }

  const doc = snap.docs[0];
  const data = doc.data();

  if (data.status === 'confirmed') {
    return 'already_confirmed';
  }

  // 7-day token expiration check
  const subscribedTime = data.subscribedAt?.toDate ? data.subscribedAt.toDate().getTime() : new Date(data.subscribedAt || 0).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - subscribedTime > sevenDaysMs) {
    return 'expired';
  }

  await doc.ref.update({
    status: 'confirmed',
    confirmedAt: new Date(),
    confirmToken: '',
  });

  // Send Welcome Email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || APP_URL || 'https://kdpstudio-aio.web.app';
  const unsubUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(data.email)}&token=${generateRandomToken(16)}`;
  await sendWelcomeEmail(data.email, data.name, unsubUrl);

  return 'confirmed';
}

/**
 * Unsubscribe user in one click (GDPR compliant)
 */
export async function unsubscribe(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const adminDb = getAdminDb();
  if (!adminDb) return false;

  const snap = await adminDb.collection('newsletterSubscribers').where('email', '==', normalizedEmail).get();
  if (snap.empty) return false;

  const batch = adminDb.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: 'unsubscribed',
      unsubscribedAt: new Date(),
    });
  });

  await batch.commit();
  return true;
}

/**
 * Get all confirmed subscribers (optionally filtered by category / tags)
 */
export async function getConfirmedSubscribers(targetTags?: string[]): Promise<NewsletterSubscriber[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const snap = await adminDb.collection('newsletterSubscribers').where('status', '==', 'confirmed').get();
  const subscribers: NewsletterSubscriber[] = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      email: d.email,
      name: d.name || null,
      subscribedAt: d.subscribedAt?.toDate ? d.subscribedAt.toDate() : new Date(d.subscribedAt || 0),
      confirmedAt: d.confirmedAt?.toDate ? d.confirmedAt.toDate() : new Date(d.confirmedAt || 0),
      status: d.status,
      source: d.source || 'unknown',
      tags: Array.isArray(d.tags) ? d.tags : [],
      unsubscribedAt: d.unsubscribedAt ? (d.unsubscribedAt?.toDate ? d.unsubscribedAt.toDate() : new Date(d.unsubscribedAt)) : null,
      confirmToken: d.confirmToken || '',
    };
  });

  if (targetTags && targetTags.length > 0) {
    const lowerTags = targetTags.map((t) => t.toLowerCase());
    return subscribers.filter((sub) => {
      if (!sub.tags || sub.tags.length === 0) return true; // generic subscribers get all
      return sub.tags.some((t) => lowerTags.includes(t.toLowerCase()));
    });
  }

  return subscribers;
}

/**
 * Dispatches automated new post notification to confirmed subscribers in batches of 100
 */
export async function sendNewsletterForPost(postId: string): Promise<number> {
  const adminDb = getAdminDb();
  if (!adminDb) return 0;

  const postDoc = await adminDb.collection('blogPosts').doc(postId).get();
  if (!postDoc.exists) return 0;

  const post = postDoc.data() as BlogPost;
  if (post.status !== 'published') return 0;

  const subscribers = await getConfirmedSubscribers(post.tags);
  if (subscribers.length === 0) return 0;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || APP_URL || 'https://kdpstudio-aio.web.app';
  const postUrl = `${baseUrl}/blog/${post.slug || postId}`;
  const batchSize = 100;
  let sentTotal = 0;

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (sub) => {
        const unsubUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`;
        try {
          await resend.emails.send({
            from: EMAIL_FROM,
            to: sub.email,
            subject: `New Post: ${post.title}`,
            html: buildNewPostEmailHtml({
              recipientName: sub.name,
              postTitle: post.title,
              postUrl,
              postExcerpt: post.excerpt || post.metaDescription || '',
              postCategory: post.category || 'Publishing Strategy',
              authorName: post.authorName || 'KDP Studio Team',
              readingTime: post.readingTime || 5,
              featuredImageUrl: post.featuredImage?.url || post.coverImage || null,
              unsubscribeUrl: unsubUrl,
            }),
          });
          sentTotal++;
        } catch (err) {
          console.warn(`[Newsletter] Failed sending to ${sub.email}:`, err);
        }
      })
    );

    // Rate-limit safety: 1 second delay between batches
    if (i + batchSize < subscribers.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Log to newsletterLogs
  await adminDb.collection('newsletterLogs').add({
    postId,
    postTitle: post.title,
    sentTo: sentTotal,
    sentAt: new Date(),
    status: 'sent',
  });

  return sentTotal;
}

/**
 * Fetch and Save Newsletter Config
 */
export async function getNewsletterConfig(): Promise<NewsletterConfig> {
  const adminDb = getAdminDb();
  if (adminDb) {
    const doc = await adminDb.collection('blogConfig').doc('newsletter').get();
    if (doc.exists) {
      return doc.data() as NewsletterConfig;
    }
  }
  return {
    autoSendOnPublish: true,
    senderName: 'KDP Studio Academy',
    senderEmail: 'newsletter@kdpstudio.com',
  };
}

export async function saveNewsletterConfig(config: Partial<NewsletterConfig>): Promise<void> {
  const adminDb = getAdminDb();
  if (adminDb) {
    await adminDb.collection('blogConfig').doc('newsletter').set(
      {
        ...config,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }
}

// ── HTML Email Builders ──

function buildConfirmEmailHtml(name: string | null, confirmUrl: string, sourcePage?: string): string {
  return `
  <!DOCTYPE html>
  <html>
    <head><meta charset="utf-8"/><title>Confirm Your Subscription</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin:0; padding:40px 20px;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="font-size: 24px; font-weight: 900; color: #7c3aed; margin-bottom: 20px;">KDP Studio</div>
        <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">You're almost subscribed!</h1>
        <p style="font-size: 14px; line-height: 24px; color: #475569; margin: 0 0 24px 0;">
          Hi ${name ? `<strong>${name}</strong>` : 'there'}, you requested to receive Amazon KDP self-publishing strategies and niche breakdowns from KDP Studio. Click the button below to confirm your email address:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}" style="background-color: #7c3aed; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(124,58,237,0.35);">
            Yes, Subscribe Me →
          </a>
        </div>
        <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px; font-size: 12px; color: #64748b; line-height: 18px; margin-top: 28px;">
          If you didn't request this email, you can safely ignore it. You will not receive any further emails unless confirmed.
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 20px; text-align: center;">
          Signed up via ${sourcePage || 'KDP Studio Blog'} · &copy; ${new Date().getFullYear()} KDP Studio
        </div>
      </div>
    </body>
  </html>
  `.trim();
}

function buildWelcomeEmailHtml(name: string | null, unsubUrl: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || APP_URL || 'https://kdpstudio-aio.web.app';
  return `
  <!DOCTYPE html>
  <html>
    <head><meta charset="utf-8"/><title>Welcome to KDP Studio Blog</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin:0; padding:40px 20px;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="font-size: 24px; font-weight: 900; color: #7c3aed; margin-bottom: 20px;">KDP Studio</div>
        <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">🎉 You're confirmed! Welcome aboard.</h1>
        <p style="font-size: 14px; line-height: 24px; color: #475569; margin: 0 0 20px 0;">
          Hi ${name ? `<strong>${name}</strong>` : 'there'}, thanks for joining 5,000+ indie authors and publishers. Every week, we deliver tested KDP niches, cover design frameworks, and algorithm updates.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${baseUrl}/blog" style="background-color: #0f172a; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px; display: inline-block;">
            Explore Latest Guides →
          </a>
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 32px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          <a href="${unsubUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a> anytime with one click.
        </div>
      </div>
    </body>
  </html>
  `.trim();
}

function buildNewPostEmailHtml(data: {
  recipientName?: string | null;
  postTitle: string;
  postUrl: string;
  postExcerpt: string;
  postCategory: string;
  authorName: string;
  readingTime: number;
  featuredImageUrl?: string | null;
  unsubscribeUrl: string;
}): string {
  return `
  <!DOCTYPE html>
  <html>
    <head><meta charset="utf-8"/><title>${data.postTitle}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin:0; padding:40px 20px;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #7c3aed; background: #f5f3ff; display: inline-block; padding: 4px 10px; border-radius: 6px; margin-bottom: 16px;">
          ${data.postCategory}
        </div>
        <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; line-height: 30px; margin: 0 0 16px 0;">
          <a href="${data.postUrl}" style="color: #0f172a; text-decoration: none;">${data.postTitle}</a>
        </h1>
        ${
          data.featuredImageUrl
            ? `<div style="margin: 0 0 20px 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;"><a href="${data.postUrl}"><img src="${data.featuredImageUrl}" alt="${data.postTitle}" style="width: 100%; height: auto; display: block;" /></a></div>`
            : ''
        }
        <p style="font-size: 14px; line-height: 24px; color: #475569; margin: 0 0 20px 0;">
          ${data.postExcerpt}
        </p>
        <div style="font-size: 12px; color: #64748b; margin-bottom: 28px;">
          By <strong>${data.authorName}</strong> · ${data.readingTime} min read
        </div>
        <div style="text-align: left; margin: 24px 0;">
          <a href="${data.postUrl}" style="background-color: #7c3aed; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 12px 24px; border-radius: 10px; display: inline-block;">
            Read Full Article →
          </a>
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 36px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          You received this because you are subscribed to KDP Studio Academy. · <a href="${data.unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>
        </div>
      </div>
    </body>
  </html>
  `.trim();
}

async function sendConfirmationEmail(email: string, name: string | null, confirmUrl: string, source?: string) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Please confirm your subscription to KDP Studio Blog',
      html: buildConfirmEmailHtml(name, confirmUrl, source),
    });
  } catch (e) {
    console.warn('[Newsletter] Failed to send confirmation email:', e);
  }
}

async function sendWelcomeEmail(email: string, name: string | null, unsubUrl: string) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Welcome to KDP Studio Blog & Strategy Academy!',
      html: buildWelcomeEmailHtml(name, unsubUrl),
    });
  } catch (e) {
    console.warn('[Newsletter] Failed to send welcome email:', e);
  }
}

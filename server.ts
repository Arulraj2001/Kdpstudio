import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createExpressUsageMiddleware } from './src/lib/withUsageCheck';
import { getUserUsageSummary } from './src/lib/usageService';

dotenv.config();

const isCJS = typeof __filename !== 'undefined' && typeof __dirname !== 'undefined';
const currentFilename = isCJS ? __filename : (typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '');
const currentDirname = isCJS ? __dirname : (currentFilename ? path.dirname(currentFilename) : process.cwd());

// Initialize Google GenAI lazily
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  // Cloud Run injects PORT env var; fallback to 3000 for local dev
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  // CORS middleware for seamless integration with Firebase Hosting & preview domains
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'KDP Studio API' });
  });

  // Auth Session Management (Step 5)
  app.post('/api/auth/session', async (req, res) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ error: 'Missing ID token' });
      }

      const expiresIn = 14 * 24 * 60 * 60 * 1000; // 14 days
      let sessionCookie = '';

      try {
        const { adminAuth } = await import('./src/lib/firebase-admin');
        sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      } catch (adminErr) {
        sessionCookie = `session_${Buffer.from(idToken.slice(0, 30)).toString('base64')}`;
      }

      const isProd = process.env.NODE_ENV === 'production';
      res.setHeader(
        'Set-Cookie',
        `__session=${sessionCookie}; Max-Age=${expiresIn / 1000}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`
      );

      return res.json({ status: 'success', sessionCreated: true });
    } catch (error: any) {
      console.error('Session creation error:', error);
      return res.status(401).json({ error: 'Unauthorized session' });
    }
  });

  app.delete('/api/auth/session', (req, res) => {
    res.setHeader('Set-Cookie', '__session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax');
    return res.json({ status: 'cleared' });
  });


  // Plan Status endpoint
  app.get('/api/user/plan', async (req, res) => {
    try {
      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let uid = (req.query.uid as string) || (req.headers['x-user-id'] as string) || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.uid) uid = decoded.uid;
        } catch (authErr) {
          console.warn('[server.ts /api/user/plan] Token verification note:', authErr);
        }
      }

      if (!uid) {
        return res.status(401).json({ error: 'Missing token or user identifier' });
      }

      const { getUserDocument } = await import('./src/lib/userService');
      const userDoc = await getUserDocument(uid);

      if (!userDoc) {
        return res.json({
          plan: 'free',
          planEndDate: null,
          billingCycle: null,
          paymentMethod: null,
          usage: { daily: {}, monthly: {} },
        });
      }

      return res.json({
        plan: userDoc.plan || 'free',
        planEndDate: userDoc.planEndDate || null,
        billingCycle: userDoc.billingCycle || null,
        paymentMethod: userDoc.paymentMethod || null,
        usage: userDoc.usage || { daily: {}, monthly: {} },
      });
    } catch (err: any) {
      console.error('[server.ts /api/user/plan] Error:', err);
      return res.status(500).json({ error: 'Failed to fetch plan status' });
    }
  });

  // Razorpay Create Subscription
  app.post('/api/payment/razorpay/create-subscription', async (req, res) => {
    try {
      const { getRazorpayClient, RAZORPAY_PLAN_IDS, isRazorpayConfigured } = await import('./src/lib/razorpay');
      const { getUserDocument, updateUserDocument } = await import('./src/lib/userService');

      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let uid = (req.headers['x-user-id'] as string) || req.body?.uid || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.uid) uid = decoded.uid;
        } catch {}
      }

      const { plan, billingCycle } = req.body || {};
      const planKey = `${plan}_${billingCycle}`;
      const planId = RAZORPAY_PLAN_IDS[planKey];
      const rzpKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';

      if (!isRazorpayConfigured() || !planId || planId.includes('REPLACE')) {
        const mockSubId = `sub_test_${Math.random().toString(36).substring(2, 10)}`;
        return res.json({
          subscriptionId: mockSubId,
          razorpayKeyId: rzpKeyId,
          isSandbox: true,
        });
      }

      const razorpay = getRazorpayClient();
      const userDoc = uid ? await getUserDocument(uid) : null;
      const email = userDoc?.email || req.body?.email || 'customer@kdpstudio.app';
      const name = userDoc?.displayName || userDoc?.name || req.body?.name || 'Author';

      let customerId = userDoc?.paymentCustomerId;
      if (!customerId) {
        try {
          const customer = await razorpay.customers.create({
            name,
            email,
            notes: { uid, plan },
          });
          customerId = customer.id;
          if (uid) await updateUserDocument(uid, { paymentCustomerId: customerId });
        } catch (e) {}
      }

      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: billingCycle === 'annual' ? 12 : 120,
        notes: { uid, plan, billingCycle },
      });

      return res.json({
        subscriptionId: subscription.id,
        razorpayKeyId: rzpKeyId,
      });
    } catch (err: any) {
      console.error('[server.ts Razorpay create-sub] Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to create subscription' });
    }
  });

  // Razorpay Verify Payment
  app.post('/api/payment/razorpay/verify', async (req, res) => {
    try {
      const { activateUserPlan, createPaymentRecord, createSubscriptionRecord } = await import('./src/lib/paymentService');
      const { getUserDocument } = await import('./src/lib/userService');
      const { PRICING_TABLE } = await import('./src/lib/geo');

      const {
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
        plan,
        billingCycle,
        uid: bodyUid,
      } = req.body || {};

      let uid = (req.headers['x-user-id'] as string) || bodyUid || '';
      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.uid) uid = decoded.uid;
        } catch {}
      }

      if (!uid) {
        return res.status(401).json({ error: 'User identifier required' });
      }

      const baseINRPrice = (PRICING_TABLE[plan as 'starter' | 'pro' | 'agency']?.INR as number) || 1499;
      const amountINR = billingCycle === 'annual' ? Math.round(baseINRPrice * 10) : baseINRPrice;
      const amountPaise = amountINR * 100;
      const now = new Date();
      const planEndDate = billingCycle === 'annual'
        ? new Date(now.getTime() + 365 * 86400000)
        : new Date(now.getTime() + 30 * 86400000);

      await activateUserPlan(
        uid,
        plan,
        billingCycle,
        'razorpay',
        razorpay_payment_id || `pay_${Date.now()}`
      );

      const userDoc = await getUserDocument(uid);
      const email = userDoc?.email || req.body?.email || 'customer@kdpstudio.app';

      const paymentRecordId = await createPaymentRecord({
        uid,
        email,
        gateway: 'razorpay',
        gatewayPaymentId: razorpay_payment_id || `pay_${Date.now()}`,
        gatewaySubscriptionId: razorpay_subscription_id || null,
        gatewayCustomerId: userDoc?.paymentCustomerId || null,
        plan,
        billingCycle,
        amount: amountPaise,
        currency: 'INR',
        status: 'completed',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        planStartDate: now.toISOString(),
        planEndDate: planEndDate.toISOString(),
        metadata: {
          razorpay_payment_id,
          razorpay_subscription_id,
          razorpay_signature,
        },
      });

      if (razorpay_subscription_id) {
        await createSubscriptionRecord({
          uid,
          gateway: 'razorpay',
          gatewaySubscriptionId: razorpay_subscription_id,
          plan,
          billingCycle,
          status: 'active',
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: planEndDate.toISOString(),
          cancelAtPeriodEnd: false,
          currency: 'INR',
          amount: amountPaise,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }

      return res.json({
        success: true,
        plan,
        paymentId: paymentRecordId,
      });
    } catch (err: any) {
      console.error('[server.ts Razorpay verify] Error:', err);
      return res.status(500).json({ error: err.message || 'Payment verification failed' });
    }
  });

  // Razorpay Webhook
  app.post('/api/webhooks/razorpay', async (req, res) => {
    try {
      const { verifyRazorpayWebhook } = await import('./src/lib/webhookSecurity');
      const { activateUserPlan, createPaymentRecord, updateSubscriptionRecord } = await import('./src/lib/paymentService');
      const { updateUserDocument, getUserDocument } = await import('./src/lib/userService');

      const signature = (req.headers['x-razorpay-signature'] as string) || '';
      const rawBody = JSON.stringify(req.body);

      // Verify webhook signature if configured
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (secret && signature && !verifyRazorpayWebhook(rawBody, signature)) {
        console.warn('[server.ts Razorpay Webhook] Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.body;
      const eventType = event?.event;
      const payload = event?.payload;

      console.log(`[server.ts Razorpay Webhook] Event: ${eventType}`);

      if (eventType === 'subscription.charged') {
        const subEntity = payload?.subscription?.entity;
        const paymentEntity = payload?.payment?.entity;
        const subscriptionId = subEntity?.id;
        const notes = subEntity?.notes || paymentEntity?.notes || {};
        const uid = notes.uid;
        const plan = notes.plan || 'pro';
        const billingCycle = notes.billingCycle || 'monthly';
        const amountPaise = paymentEntity?.amount || 149900;

        if (uid) {
          await activateUserPlan(uid, plan, billingCycle, 'razorpay', paymentEntity?.id || subscriptionId);
          await updateUserDocument(uid, { paymentFailed: false });

          const now = new Date();
          const planEndDate = billingCycle === 'annual'
            ? new Date(now.getTime() + 365 * 86400000)
            : new Date(now.getTime() + 30 * 86400000);

          await createPaymentRecord({
            uid,
            email: paymentEntity?.email || notes.email || '',
            gateway: 'razorpay',
            gatewayPaymentId: paymentEntity?.id || `pay_${Date.now()}`,
            gatewaySubscriptionId: subscriptionId || null,
            gatewayCustomerId: subEntity?.customer_id || null,
            plan,
            billingCycle,
            amount: amountPaise,
            currency: 'INR',
            status: 'completed',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            planStartDate: now.toISOString(),
            planEndDate: planEndDate.toISOString(),
            metadata: { eventType },
          });
        }
      } else if (eventType === 'subscription.cancelled') {
        const subEntity = payload?.subscription?.entity;
        const subscriptionId = subEntity?.id;
        if (subscriptionId) {
          await updateSubscriptionRecord(subscriptionId, {
            status: 'cancelled',
            cancelAtPeriodEnd: true,
          });
        }
      } else if (eventType === 'subscription.halted' || eventType === 'payment.failed') {
        const notes = payload?.subscription?.entity?.notes || payload?.payment?.entity?.notes || {};
        const paymentEntity = payload?.payment?.entity;
        const uid = notes.uid;
        if (uid) {
          await updateUserDocument(uid, { paymentFailed: true });

          // Non-blocking email dispatch
          import('./src/lib/emailService').then(({ sendPaymentFailedEmail }) => {
            getUserDocument(uid).then((doc) => {
              if (doc?.email) {
                const email = doc.email;
                const name = doc.name || doc.displayName || email.split('@')[0];
                const plan = notes.plan || doc.plan || 'pro';
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://kdpstudio.com';
                const amtFormatted = paymentEntity?.amount ? `₹${paymentEntity.amount / 100}` : '₹1,499';
                sendPaymentFailedEmail({
                  to: email,
                  name,
                  plan,
                  amount: amtFormatted,
                  gateway: 'Razorpay',
                  retryUrl: `${appUrl}/settings/billing`,
                }).catch(console.error);
              }
            }).catch(console.error);
          }).catch(console.error);
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error('[server.ts Razorpay Webhook] Error:', err);
      return res.json({ received: true, error: err.message });
    }
  });

  // PayPal Create Subscription
  app.post('/api/payment/paypal/create-subscription', async (req, res) => {
    try {
      const { paypalRequest, PAYPAL_PLAN_IDS, isPayPalConfigured } = await import('./src/lib/paypal');
      const { getUserDocument } = await import('./src/lib/userService');

      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let uid = (req.headers['x-user-id'] as string) || req.body?.uid || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.uid) uid = decoded.uid;
        } catch {}
      }

      if (!uid) {
        return res.status(401).json({ error: 'User identifier required' });
      }

      const { plan, billingCycle, currency = 'USD' } = req.body || {};
      const userDoc = await getUserDocument(uid);
      const email = userDoc?.email || req.body?.email || 'customer@kdpstudio.app';
      const fullName = userDoc?.displayName || userDoc?.name || req.body?.name || 'Author User';
      const nameParts = fullName.trim().split(' ');
      const given_name = nameParts[0] || 'Author';
      const surname = nameParts.slice(1).join(' ') || 'User';

      const normalizedCurr = (currency || 'USD').toLowerCase();
      let planKey = `${plan}_${billingCycle}_${normalizedCurr}`;
      if (!PAYPAL_PLAN_IDS[planKey] || PAYPAL_PLAN_IDS[planKey].includes('REPLACE')) {
        planKey = `${plan}_${billingCycle}_usd`;
      }

      const planId = PAYPAL_PLAN_IDS[planKey];
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';

      if (!isPayPalConfigured() || !planId || planId.includes('REPLACE')) {
        const mockSubId = `I-MOCK_PAYPAL_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const mockApprovalUrl = `/api/payment/paypal/success?subscription_id=${mockSubId}&token=MOCK_TOKEN&uid=${encodeURIComponent(uid)}&plan=${plan}&billingCycle=${billingCycle}`;

        return res.json({
          approvalUrl: mockApprovalUrl,
          subscriptionId: mockSubId,
          isSandbox: true,
        });
      }

      const payload = {
        plan_id: planId,
        subscriber: {
          name: { given_name, surname },
          email_address: email,
        },
        application_context: {
          brand_name: 'KDP Studio',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${appUrl}/api/payment/paypal/success`,
          cancel_url: `${appUrl}/pricing?cancelled=true`,
        },
        custom_id: uid,
      };

      const subResponse = await paypalRequest('POST', '/v1/billing/subscriptions', payload);
      const approveLink = subResponse.links?.find((l: any) => l.rel === 'approve')?.href;

      if (!approveLink) {
        throw new Error('PayPal did not return an approval link');
      }

      return res.json({
        approvalUrl: approveLink,
        subscriptionId: subResponse.id,
      });
    } catch (err: any) {
      console.error('[server.ts PayPal create-sub] Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to create PayPal subscription' });
    }
  });

  // PayPal Success Redirect Return Handler
  app.get('/api/payment/paypal/success', async (req, res) => {
    try {
      const { paypalRequest, getPlanFromPayPalPlanId, isPayPalConfigured } = await import('./src/lib/paypal');
      const { activateUserPlan, createPaymentRecord, createSubscriptionRecord } = await import('./src/lib/paymentService');
      const { getUserDocument } = await import('./src/lib/userService');
      const { PRICING_TABLE } = await import('./src/lib/geo');

      const subscriptionId = (req.query.subscription_id as string) || (req.query.subscriptionId as string) || '';
      const paramUid = (req.query.uid as string) || '';
      const paramPlan = ((req.query.plan as string) || 'pro') as any;
      const paramCycle = ((req.query.billingCycle as string) || 'monthly') as any;

      if (!subscriptionId) {
        return res.redirect('/pricing?error=payment_failed');
      }

      let uid = paramUid;
      let plan = paramPlan;
      let billingCycle = paramCycle;
      let payerId: string | null = null;

      if (isPayPalConfigured() && !subscriptionId.startsWith('I-MOCK_')) {
        const subDetails = await paypalRequest('GET', `/v1/billing/subscriptions/${subscriptionId}`);
        if (subDetails?.custom_id) uid = subDetails.custom_id;
        payerId = subDetails?.subscriber?.payer_id || null;
        if (subDetails?.plan_id) {
          const detected = getPlanFromPayPalPlanId(subDetails.plan_id);
          if (detected) {
            plan = detected.plan;
            billingCycle = detected.billingCycle;
          }
        }
      }

      if (!uid) {
        return res.redirect('/pricing?error=user_not_found');
      }

      const baseUsd = (PRICING_TABLE[plan as 'starter' | 'pro' | 'agency']?.USD as number) || 19;
      const finalAmountUsd = billingCycle === 'annual' ? Math.round(baseUsd * 10) : baseUsd;
      const amountUsd = finalAmountUsd * 100;

      const now = new Date();
      const planEndDate = billingCycle === 'annual'
        ? new Date(now.getTime() + 365 * 86400000)
        : new Date(now.getTime() + 30 * 86400000);

      await activateUserPlan(uid, plan, billingCycle, 'paypal', subscriptionId);

      const userDoc = await getUserDocument(uid);
      const email = userDoc?.email || 'customer@kdpstudio.app';

      await createPaymentRecord({
        uid,
        email,
        gateway: 'paypal',
        gatewayPaymentId: `pay_pp_${Date.now()}`,
        gatewaySubscriptionId: subscriptionId,
        gatewayCustomerId: payerId,
        plan,
        billingCycle,
        amount: amountUsd,
        currency: 'USD',
        status: 'completed',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        planStartDate: now.toISOString(),
        planEndDate: planEndDate.toISOString(),
        metadata: { subscriptionId },
      });

      await createSubscriptionRecord({
        uid,
        gateway: 'paypal',
        gatewaySubscriptionId: subscriptionId,
        plan,
        billingCycle,
        status: 'active',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: planEndDate.toISOString(),
        cancelAtPeriodEnd: false,
        currency: 'USD',
        amount: amountUsd,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

      return res.redirect(`/dashboard?payment=success&plan=${plan}`);
    } catch (err: any) {
      console.error('[server.ts PayPal success] Error:', err);
      return res.redirect('/pricing?error=payment_failed');
    }
  });

  // PayPal Webhook
  app.post('/api/webhooks/paypal', async (req, res) => {
    try {
      const { verifyPayPalWebhook } = await import('./src/lib/webhookSecurity');
      const { activateUserPlan, createPaymentRecord, updateSubscriptionRecord } = await import('./src/lib/paymentService');
      const { updateUserDocument } = await import('./src/lib/userService');
      const { getPlanFromPayPalPlanId } = await import('./src/lib/paypal');

      const rawBody = JSON.stringify(req.body);
      const isValid = await verifyPayPalWebhook(req.headers as any, rawBody);

      if (!isValid) {
        console.warn('[server.ts PayPal Webhook] Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.body;
      const eventType = event?.event_type;
      const resource = event?.resource || {};

      console.log(`[server.ts PayPal Webhook] Event: ${eventType}`);

      if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
        const subscriptionId = resource.id;
        const uid = resource.custom_id;
        const planId = resource.plan_id;
        const detected = getPlanFromPayPalPlanId(planId);
        const plan = detected?.plan || 'pro';
        const billingCycle = detected?.billingCycle || 'monthly';

        if (uid) {
          await activateUserPlan(uid, plan, billingCycle, 'paypal', subscriptionId);
          await updateUserDocument(uid, { paymentFailed: false });

          const now = new Date();
          const planEndDate = billingCycle === 'annual'
            ? new Date(now.getTime() + 365 * 86400000)
            : new Date(now.getTime() + 30 * 86400000);

          await createPaymentRecord({
            uid,
            email: resource.subscriber?.email_address || '',
            gateway: 'paypal',
            gatewayPaymentId: `pay_pp_${Date.now()}`,
            gatewaySubscriptionId: subscriptionId,
            gatewayCustomerId: resource.subscriber?.payer_id || null,
            plan,
            billingCycle,
            amount: (resource.billing_info?.last_payment?.amount?.value || 19) * 100,
            currency: resource.billing_info?.last_payment?.amount?.currency_code || 'USD',
            status: 'completed',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            planStartDate: now.toISOString(),
            planEndDate: planEndDate.toISOString(),
            metadata: { eventType },
          });
        }
      } else if (eventType === 'PAYMENT.SALE.COMPLETED') {
        const subscriptionId = resource.billing_agreement_id;
        const uid = resource.custom || '';
        if (uid) {
          await activateUserPlan(uid, 'pro', 'monthly', 'paypal', subscriptionId);
          await updateUserDocument(uid, { paymentFailed: false });
        }
      } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
        const subscriptionId = resource.id;
        if (subscriptionId) {
          await updateSubscriptionRecord(subscriptionId, {
            status: 'cancelled',
            cancelAtPeriodEnd: true,
          });
        }
      } else if (eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' || eventType === 'PAYMENT.SALE.DENIED') {
        const uid = resource.custom_id || resource.custom;
        if (uid) {
          await updateUserDocument(uid, { paymentFailed: true });

          import('./src/lib/emailService').then(({ sendPaymentFailedEmail }) => {
            import('./src/lib/userService').then(({ getUserDocument }) => {
              getUserDocument(uid).then((doc) => {
                if (doc?.email) {
                  const email = doc.email;
                  const name = doc.name || doc.displayName || email.split('@')[0];
                  const plan = doc.plan || 'pro';
                  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://kdpstudio.com';
                  const amtFormatted = resource.amount?.total ? `$${resource.amount.total}` : '$19.00';
                  sendPaymentFailedEmail({
                    to: email,
                    name,
                    plan,
                    amount: amtFormatted,
                    gateway: 'PayPal',
                    retryUrl: `${appUrl}/settings/billing`,
                  }).catch(console.error);
                }
              }).catch(console.error);
            }).catch(console.error);
          }).catch(console.error);
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error('[server.ts PayPal Webhook] Error:', err);
      return res.json({ received: true, error: err.message });
    }
  });

  // ─────────────────────────────────────────
  // UPI DIRECT & ADMIN ENDPOINTS
  // ─────────────────────────────────────────

  // UPI Submit Manual Payment
  app.post('/api/payment/upi/submit', async (req, res) => {
    try {
      const { createUpiPendingPayment, checkUtrExists } = await import('./src/lib/paymentService');
      const { getUserDocument } = await import('./src/lib/userService');

      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let uid = (req.headers['x-user-id'] as string) || req.body?.uid || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.uid) uid = decoded.uid;
        } catch {}
      }

      if (!uid) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { plan, billingCycle, amount, utrNumber, screenshotUrl } = req.body || {};

      if (!plan || !billingCycle || !amount || !utrNumber) {
        return res.status(400).json({ error: 'Missing required parameters (plan, billingCycle, amount, utrNumber)' });
      }

      const utrClean = utrNumber.trim().toUpperCase();
      if (!/^[A-Z0-9]{12,22}$/.test(utrClean)) {
        return res.status(400).json({
          error: 'Invalid UTR format. UTR must be 12-22 alphanumeric characters without spaces or hyphens.',
        });
      }

      const isDuplicate = await checkUtrExists(utrClean);
      if (isDuplicate) {
        return res.status(400).json({
          error: 'This UTR has already been submitted. Please check the reference number.',
        });
      }

      const userDoc = await getUserDocument(uid);
      const email = userDoc?.email || req.body?.email || 'customer@kdpstudio.app';
      const name = userDoc?.name || userDoc?.displayName || email.split('@')[0];

      const pendingId = await createUpiPendingPayment({
        uid,
        email,
        name,
        plan,
        billingCycle,
        amount,
        utrNumber: utrClean,
        screenshotUrl: screenshotUrl || null,
      });

      try {
        const { sendAdminUpiPendingEmail, sendUpiSubmittedEmail } = await import('./src/lib/emailService');
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://kdpstudio.com';

        sendAdminUpiPendingEmail({
          userName: name,
          userEmail: email,
          plan,
          amount: '₹' + amount,
          utrNumber: utrClean,
          pendingId,
          adminUrl: `${appUrl}/admin`,
        }).catch(console.error);

        sendUpiSubmittedEmail({
          to: email,
          name,
          plan,
          amount: '₹' + amount,
          utrNumber: utrClean,
          estimatedTime: '2-4 hours (business hours IST)',
        }).catch(console.error);
      } catch (e) {}

      console.log(`[Admin Email Notification] Pending UPI Verification: ${name} (${email}) paid ₹${amount} for ${plan}. UTR: ${utrClean}`);

      return res.json({
        success: true,
        pendingId,
        message: 'UPI payment submitted for verification. We will verify and upgrade your plan within 2-4 hours.',
      });
    } catch (err: any) {
      console.error('[server.ts UPI submit] Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to submit UPI payment' });
    }
  });

  // Cancel Subscription Endpoint
  app.post('/api/payment/cancel-subscription', async (req, res) => {
    try {
      const { getUserDocument, updateUserDocument } = await import('./src/lib/userService');
      const { getUserActiveSubscription, updateSubscriptionRecord } = await import('./src/lib/paymentService');
      const { cancelPayPalSubscription } = await import('./src/lib/paypal');
      const { cancelRazorpaySubscription } = await import('./src/lib/razorpay');

      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let uid = (req.headers['x-user-id'] as string) || req.body?.uid || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.uid) uid = decoded.uid;
        } catch {}
      }

      if (!uid) {
        return res.status(401).json({ error: 'Authentication required to cancel subscription' });
      }

      const userDoc = await getUserDocument(uid);
      if (!userDoc) {
        return res.status(404).json({ error: 'User document not found' });
      }

      const { reason = 'User requested cancellation', notes = '' } = req.body || {};

      // Retrieve user's active subscription
      const activeSub = await getUserActiveSubscription(uid);

      if (activeSub) {
        if (activeSub.gateway === 'razorpay' && activeSub.gatewaySubscriptionId) {
          await cancelRazorpaySubscription(activeSub.gatewaySubscriptionId);
        } else if (activeSub.gateway === 'paypal' && activeSub.gatewaySubscriptionId) {
          await cancelPayPalSubscription(activeSub.gatewaySubscriptionId, reason);
        }

        await updateSubscriptionRecord(activeSub.id, {
          status: 'cancelled',
          cancelAtPeriodEnd: true,
        });
      }

      const planEndDate = userDoc.planEndDate || new Date(Date.now() + 30 * 86400000).toISOString();
      await updateUserDocument(uid, {
        subscriptionCancelled: true,
        subscriptionCancelReason: reason,
        subscriptionCancelNotes: notes,
      });

      // Send cancellation email
      try {
        const { sendPlanCancelledEmail } = await import('./src/lib/emailService');
        const userEmail = userDoc.email || 'customer@kdpstudio.app';
        const userName = userDoc.name || userDoc.displayName || userEmail.split('@')[0];
        const plan = userDoc.plan || 'pro';
        const endFormatted = userDoc.planEndDate ? new Date(userDoc.planEndDate).toLocaleDateString() : new Date(Date.now() + 30 * 86400000).toLocaleDateString();

        sendPlanCancelledEmail({
          to: userEmail,
          name: userName,
          plan: plan,
          activeUntil: endFormatted,
        }).catch(console.error);
      } catch (e) {}

      console.log(`[Cancellation] User ${uid} (${userDoc.email}) cancelled subscription. Reason: ${reason}`);

      return res.json({
        success: true,
        message: 'Subscription marked for cancellation. Your plan remains active until the end of your billing cycle.',
        activeUntil: planEndDate,
      });
    } catch (err: any) {
      console.error('[server.ts cancel-subscription] Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to cancel subscription' });
    }
  });


  // UPI Status
  app.get('/api/payment/upi/status', async (req, res) => {
    try {
      const { getUserPendingUpiPayment } = await import('./src/lib/paymentService');

      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let uid = (req.query.uid as string) || (req.headers['x-user-id'] as string) || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.uid) uid = decoded.uid;
        } catch {}
      }

      if (!uid) {
        return res.json({ pending: null });
      }

      const pending = await getUserPendingUpiPayment(uid);
      return res.json({ pending });
    } catch (err: any) {
      console.error('[server.ts UPI status] Error:', err);
      return res.status(500).json({ pending: null, error: err.message });
    }
  });

  // Admin UPI Approve
  app.post('/api/admin/upi/approve', async (req, res) => {
    try {
      const { approveUpiPayment } = await import('./src/lib/paymentService');

      const adminEmail = process.env.ADMIN_EMAIL || 'arulraj8637@gmail.com';
      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let requesterEmail = (req.headers['x-user-email'] as string) || req.body?.adminEmail || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.email) requesterEmail = decoded.email;
        } catch {}
      }

      if (requesterEmail.toLowerCase() !== adminEmail.toLowerCase()) {
        return res.status(403).json({ error: 'Forbidden: Administrator credentials required' });
      }

      const { pendingId } = req.body || {};
      if (!pendingId) {
        return res.status(400).json({ error: 'Missing required parameter: pendingId' });
      }

      await approveUpiPayment(pendingId, adminEmail);

      try {
        const { sendUpiApprovedEmail } = await import('./src/lib/emailService');
        const { getUserPendingUpiPayment } = await import('./src/lib/paymentService');
        const pending = await getUserPendingUpiPayment(pendingId);
        if (pending?.email) {
          const planEndDate = pending.billingCycle === 'lifetime'
            ? null
            : new Date(Date.now() + (pending.billingCycle === 'annual' ? 365 : 30) * 86400000);

          sendUpiApprovedEmail({
            to: pending.email,
            name: pending.name || 'Kindle Author',
            plan: pending.plan,
            amount: '₹' + pending.amount,
            activeUntil: planEndDate?.toLocaleDateString() || null,
          }).catch(console.error);
        }
      } catch (e) {}

      return res.json({
        success: true,
        message: `UPI payment ${pendingId} approved successfully`,
      });
    } catch (err: any) {
      console.error('[server.ts Admin UPI approve] Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to approve UPI payment' });
    }
  });

  // Admin UPI Reject
  app.post('/api/admin/upi/reject', async (req, res) => {
    try {
      const { rejectUpiPayment } = await import('./src/lib/paymentService');

      const adminEmail = process.env.ADMIN_EMAIL || 'arulraj8637@gmail.com';
      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let requesterEmail = (req.headers['x-user-email'] as string) || req.body?.adminEmail || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.email) requesterEmail = decoded.email;
        } catch {}
      }

      if (requesterEmail.toLowerCase() !== adminEmail.toLowerCase()) {
        return res.status(403).json({ error: 'Forbidden: Administrator credentials required' });
      }

      const { pendingId, reason = 'Verification failed', notes = '' } = req.body || {};
      if (!pendingId) {
        return res.status(400).json({ error: 'Missing required parameter: pendingId' });
      }

      const fullReason = notes ? `${reason} (${notes})` : reason;
      await rejectUpiPayment(pendingId, fullReason, adminEmail);

      try {
        const { sendUpiRejectedEmail } = await import('./src/lib/emailService');
        const { getUserPendingUpiPayment } = await import('./src/lib/paymentService');
        const pending = await getUserPendingUpiPayment(pendingId);
        if (pending?.email) {
          sendUpiRejectedEmail({
            to: pending.email,
            name: pending.name || 'Kindle Author',
            plan: pending.plan,
            amount: '₹' + pending.amount,
            reason: fullReason,
            supportEmail: process.env.EMAIL_REPLY_TO || 'support@kdpstudio.com',
          }).catch(console.error);
        }
      } catch (e) {}

      return res.json({
        success: true,
        message: `UPI payment ${pendingId} rejected successfully`,
      });
    } catch (err: any) {
      console.error('[server.ts Admin UPI reject] Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to reject UPI payment' });
    }
  });

  // ─────────────────────────────────────────
  // BUY ME A COFFEE (BMaC) ENDPOINTS
  // ─────────────────────────────────────────

  // Buy Me a Coffee Webhook
  app.post('/api/webhooks/bmac', async (req, res) => {
    try {
      const { verifyBmacWebhook } = await import('./src/lib/webhookSecurity');
      const { matchBmacTier, saveBmacUnmatchedPayment } = await import('./src/lib/bmac');
      const { getUserByEmail, addCredits } = await import('./src/lib/userService');
      const { activateUserPlan, createPaymentRecord } = await import('./src/lib/paymentService');

      const rawBody = JSON.stringify(req.body);
      const signature =
        (req.headers['x-signature-sha256'] as string) ||
        (req.headers['x-bmac-signature'] as string) ||
        (req.headers['x-webhook-signature'] as string) ||
        '';

      const isValid = verifyBmacWebhook(rawBody, signature);
      if (!isValid && process.env.NODE_ENV === 'production') {
        console.warn('[server.ts BMaC Webhook] Signature verification failed');
      }

      const payload = req.body;
      const data = payload?.data || payload?.response || payload || {};
      const amountPaid = parseFloat(data.amount || data.total_amount || data.payment_amount || '0');
      const supportCoffees = parseInt(data.support_coffees || data.coffees || data.quantity || '0', 10) || Math.max(1, Math.floor(amountPaid / 6));
      const rawEmail = (data.supporter_email || data.email || data.payer_email || '').toLowerCase().trim();
      const supporterName = data.supporter_name || data.name || data.payer_name || 'Kindle Creator Supporter';
      const bmacPaymentId = data.support_id || data.order_id || data.payment_id || data.id || `bmac_${Date.now()}`;
      const supportNote = data.support_note || data.note || data.message || '';
      const isSubscription = Boolean(data.is_subscription || payload?.type?.includes('subscription'));

      console.log(`[server.ts BMaC Webhook] $${amountPaid} (${supportCoffees} coffees) from ${rawEmail}`);

      if (!rawEmail) {
        await saveBmacUnmatchedPayment({
          bmacPaymentId,
          amount: amountPaid,
          supportCoffees,
          supporterEmail: 'anonymous@buymeacoffee.com',
          supporterName,
          supportNote,
          isSubscription,
        });
        return res.json({ received: true, status: 'unmatched_no_email' });
      }

      const matchedTier = matchBmacTier(amountPaid);
      const userDoc = await getUserByEmail(rawEmail);

      if (!userDoc) {
        console.warn(`[server.ts BMaC Webhook] User not found for ${rawEmail}, saving to unmatched`);
        await saveBmacUnmatchedPayment({
          bmacPaymentId,
          amount: amountPaid,
          supportCoffees,
          supporterEmail: rawEmail,
          supporterName,
          supportNote,
          isSubscription,
        });
        return res.json({ received: true, status: 'unmatched_saved' });
      }

      const nowIso = new Date().toISOString();

      if (matchedTier?.reward === 'credits') {
        const creditsToAdd = matchedTier.credits || (supportCoffees * 50);
        await addCredits(userDoc.uid, creditsToAdd);

        await createPaymentRecord({
          uid: userDoc.uid,
          email: userDoc.email,
          gateway: 'bmac',
          gatewayPaymentId: String(bmacPaymentId),
          gatewaySubscriptionId: null,
          gatewayCustomerId: null,
          plan: userDoc.plan || 'free',
          billingCycle: 'monthly',
          amount: amountPaid,
          currency: 'USD',
          status: 'completed',
          createdAt: nowIso,
          updatedAt: nowIso,
          planStartDate: nowIso,
          planEndDate: userDoc.planEndDate || null,
          metadata: { reward: 'credits', creditsGranted: creditsToAdd, supportCoffees, supporterName, supportNote },
        });
        import('./src/lib/emailService').then(({ sendBmacReceivedEmail }) => {
          sendBmacReceivedEmail({
            to: rawEmail,
            name: supporterName,
            amount: '$' + amountPaid,
            reward: matchedTier?.description || 'Bonus Credits',
            credits: creditsToAdd,
          }).catch(console.error);
        }).catch(console.error);
      } else if (matchedTier?.reward === 'plan' && matchedTier.plan) {
        const planToSet = matchedTier.plan;
        const cycleToSet = matchedTier.billingCycle || 'monthly';

        await activateUserPlan(userDoc.uid, planToSet, cycleToSet, 'bmac', String(bmacPaymentId));

        await createPaymentRecord({
          uid: userDoc.uid,
          email: userDoc.email,
          gateway: 'bmac',
          gatewayPaymentId: String(bmacPaymentId),
          gatewaySubscriptionId: null,
          gatewayCustomerId: null,
          plan: planToSet,
          billingCycle: cycleToSet,
          amount: amountPaid,
          currency: 'USD',
          status: 'completed',
          createdAt: nowIso,
          updatedAt: nowIso,
          planStartDate: nowIso,
          planEndDate:
            cycleToSet === 'lifetime'
              ? null
              : new Date(Date.now() + (cycleToSet === 'annual' ? 365 : 30) * 86400000).toISOString(),
          metadata: { reward: 'plan', planGranted: planToSet, billingCycle: cycleToSet, supportCoffees, supporterName, supportNote },
        });

        import('./src/lib/emailService').then(({ sendBmacReceivedEmail }) => {
          sendBmacReceivedEmail({
            to: rawEmail,
            name: supporterName,
            amount: '$' + amountPaid,
            reward: matchedTier.description,
            plan: planToSet,
          }).catch(console.error);
        }).catch(console.error);
      } else {
        const bonusCredits = Math.max(10, Math.round(amountPaid * 10));
        await addCredits(userDoc.uid, bonusCredits);

        import('./src/lib/emailService').then(({ sendBmacReceivedEmail }) => {
          sendBmacReceivedEmail({
            to: rawEmail,
            name: supporterName,
            amount: '$' + amountPaid,
            reward: 'Bonus Credits',
            credits: bonusCredits,
          }).catch(console.error);
        }).catch(console.error);
      }

      return res.json({ received: true, status: 'success', uid: userDoc.uid });
    } catch (err: any) {
      console.error('[server.ts BMaC Webhook] Error:', err);
      // Always return 200 to BMaC
      return res.json({ received: true, error: err.message });
    }
  });

  // Admin Get Unmatched BMaC Payments
  app.get('/api/admin/bmac/unmatched', async (req, res) => {
    try {
      const { getBmacUnmatchedPayments } = await import('./src/lib/bmac');

      const adminEmail = process.env.ADMIN_EMAIL || 'arulraj8637@gmail.com';
      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let requesterEmail = (req.headers['x-user-email'] as string) || (req.query.adminEmail as string) || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.email) requesterEmail = decoded.email;
        } catch {}
      }

      if (requesterEmail.toLowerCase() !== adminEmail.toLowerCase() && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Forbidden: Administrator credentials required' });
      }

      const list = await getBmacUnmatchedPayments();
      return res.json({ payments: list });
    } catch (err: any) {
      console.error('[server.ts Admin BMaC unmatched list] Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to list unmatched BMaC payments' });
    }
  });

  // Admin Manual Match BMaC Payment
  app.post('/api/admin/bmac/match', async (req, res) => {
    try {
      const { resolveBmacUnmatchedPayment, matchBmacTier } = await import('./src/lib/bmac');
      const { getUserByEmail, getUserDocument, addCredits } = await import('./src/lib/userService');
      const { activateUserPlan, createPaymentRecord } = await import('./src/lib/paymentService');

      const adminEmail = process.env.ADMIN_EMAIL || 'arulraj8637@gmail.com';
      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let requesterEmail = (req.headers['x-user-email'] as string) || req.body?.adminEmail || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.email) requesterEmail = decoded.email;
        } catch {}
      }

      if (requesterEmail.toLowerCase() !== adminEmail.toLowerCase() && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Forbidden: Administrator credentials required' });
      }

      const { unmatchedId, targetUid, targetEmail, amount, supportCoffees = 1 } = req.body || {};

      if (!unmatchedId || (!targetUid && !targetEmail)) {
        return res.status(400).json({ error: 'Missing unmatchedId or target user identifier' });
      }

      let targetUser = targetUid ? await getUserDocument(targetUid) : null;
      if (!targetUser && targetEmail) {
        targetUser = await getUserByEmail(targetEmail);
      }

      if (!targetUser) {
        return res.status(404).json({ error: `Target user (${targetUid || targetEmail}) not found` });
      }

      const paidAmount = Number(amount) || 6;
      const matchedTier = matchBmacTier(paidAmount);
      let rewardGrantedDesc = '';
      const nowIso = new Date().toISOString();

      if (matchedTier?.reward === 'credits') {
        const creditsToAdd = matchedTier.credits || (supportCoffees * 50);
        await addCredits(targetUser.uid, creditsToAdd);
        rewardGrantedDesc = `${creditsToAdd} Bonus Credits`;

        await createPaymentRecord({
          uid: targetUser.uid,
          email: targetUser.email,
          gateway: 'bmac',
          gatewayPaymentId: unmatchedId,
          gatewaySubscriptionId: null,
          gatewayCustomerId: null,
          plan: targetUser.plan || 'free',
          billingCycle: 'monthly',
          amount: paidAmount,
          currency: 'USD',
          status: 'completed',
          createdAt: nowIso,
          updatedAt: nowIso,
          planStartDate: nowIso,
          planEndDate: targetUser.planEndDate || null,
          metadata: { reward: 'credits', creditsGranted: creditsToAdd, matchedByAdmin: adminEmail },
        });
      } else if (matchedTier?.reward === 'plan' && matchedTier.plan) {
        const planToSet = matchedTier.plan;
        const cycleToSet = matchedTier.billingCycle || 'monthly';

        await activateUserPlan(targetUser.uid, planToSet, cycleToSet, 'bmac', unmatchedId);
        rewardGrantedDesc = `${planToSet.toUpperCase()} Plan (${cycleToSet})`;

        await createPaymentRecord({
          uid: targetUser.uid,
          email: targetUser.email,
          gateway: 'bmac',
          gatewayPaymentId: unmatchedId,
          gatewaySubscriptionId: null,
          gatewayCustomerId: null,
          plan: planToSet,
          billingCycle: cycleToSet,
          amount: paidAmount,
          currency: 'USD',
          status: 'completed',
          createdAt: nowIso,
          updatedAt: nowIso,
          planStartDate: nowIso,
          planEndDate:
            cycleToSet === 'lifetime'
              ? null
              : new Date(Date.now() + (cycleToSet === 'annual' ? 365 : 30) * 86400000).toISOString(),
          metadata: { reward: 'plan', planGranted: planToSet, matchedByAdmin: adminEmail },
        });
      } else {
        const creditsToAdd = Math.max(10, Math.round(paidAmount * 10));
        await addCredits(targetUser.uid, creditsToAdd);
        rewardGrantedDesc = `${creditsToAdd} Bonus Credits`;
      }

      await resolveBmacUnmatchedPayment(unmatchedId, targetUser.uid, adminEmail, rewardGrantedDesc);

      return res.json({
        success: true,
        message: `Successfully matched payment to ${targetUser.email}. Granted: ${rewardGrantedDesc}`,
        targetUid: targetUser.uid,
        rewardGranted: rewardGrantedDesc,
      });
    } catch (err: any) {
      console.error('[server.ts Admin BMaC match] Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to match BMaC payment' });
    }
  });

  // ─────────────────────────────────────────
  // EMAIL PREFERENCES & UNSUBSCRIBE
  // ─────────────────────────────────────────
  app.get('/api/email/unsubscribe', async (req, res) => {
    try {
      const { verifyUnsubscribeToken } = await import('./src/lib/emailService');
      const { getAdminDb } = await import('./src/lib/firebase-admin');

      const uid = (req.query.uid as string) || '';
      const token = (req.query.token as string) || '';

      if (!uid || !token || !verifyUnsubscribeToken(uid, token)) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html><head><meta charset="utf-8"><title>Invalid Link</title></head>
          <body style="font-family:sans-serif;background:#0f172a;color:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
            <div style="background:#1e293b;padding:32px;border-radius:12px;max-width:400px;text-align:center;">
              <h2 style="color:#ef4444;margin-top:0;">⚠️ Invalid Link</h2>
              <p style="color:#94a3b8;">This unsubscribe link is invalid or has expired.</p>
              <a href="/" style="color:#a855f7;text-decoration:none;font-weight:600;">Return to KDP Studio</a>
            </div>
          </body></html>
        `);
      }

      let prefs = { weeklyDigest: true, usageWarnings: true, marketing: true };
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

      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Preferences — KDP Studio</title>
          <style>
            body { margin: 0; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; box-sizing: border-box; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #ffffff; }
            p.desc { font-size: 14px; color: #94a3b8; margin: 0 0 24px 0; line-height: 1.5; }
            .option-group { display: flex; flex-direction: column; gap: 16px; margin-bottom: 28px; }
            .option { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: 10px; background-color: #0f172a80; border: 1px solid #33415560; }
            .option input { margin-top: 3px; cursor: pointer; accent-color: #7c3aed; width: 16px; height: 16px; }
            .option label { font-size: 14px; font-weight: 600; color: #f1f5f9; cursor: pointer; display: block; }
            .option .sub { font-size: 12px; font-weight: 400; color: #64748b; margin-top: 2px; display: block; }
            .option.disabled { opacity: 0.6; background-color: #0f172a40; }
            .option.disabled label { cursor: not-allowed; }
            .btn { width: 100%; background: linear-gradient(135deg, #7c3aed, #6366f1); color: #ffffff; border: none; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
            .footer a { color: #a855f7; text-decoration: none; }
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
            <div class="footer"><a href="/">Back to KDP Studio</a></div>
          </div>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error('[server.ts Unsubscribe GET] Error:', err);
      return res.status(500).send('An error occurred while loading email preferences.');
    }
  });

  app.post('/api/email/unsubscribe', async (req, res) => {
    try {
      const { verifyUnsubscribeToken } = await import('./src/lib/emailService');
      const { getAdminDb } = await import('./src/lib/firebase-admin');

      const uid = (req.body?.uid as string) || '';
      const token = (req.body?.token as string) || '';
      const weeklyDigest = req.body?.weeklyDigest === 'true' || req.body?.weeklyDigest === true;
      const usageWarnings = req.body?.usageWarnings === 'true' || req.body?.usageWarnings === true;
      const marketing = req.body?.marketing === 'true' || req.body?.marketing === true;

      if (!uid || !token || !verifyUnsubscribeToken(uid, token)) {
        return res.status(400).send('Invalid or expired unsubscribe token.');
      }

      const adminDb = getAdminDb();
      if (adminDb && uid !== 'guest') {
        await adminDb.collection('users').doc(uid).set(
          {
            settings: {
              emailPreferences: {
                weeklyDigest,
                usageWarnings,
                marketing,
                billing: true,
                security: true,
              },
              weeklyDigest,
            },
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Preferences Saved — KDP Studio</title>
          <style>
            body { margin: 0; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 440px; width: 100%; text-align: center; }
            h1 { font-size: 20px; color: #34d399; margin-bottom: 12px; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
            a { color: #a855f7; text-decoration: none; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✅ Preferences Saved</h1>
            <p>Your email notification settings have been updated successfully.</p>
            <a href="/">Return to KDP Studio</a>
          </div>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error('[server.ts Unsubscribe POST] Error:', err);
      return res.status(500).send('Failed to update email preferences.');
    }
  });

  // ─────────────────────────────────────────
  // CRON JOBS & EMAIL PREFERENCES ENDPOINTS
  // ─────────────────────────────────────────

  // User Email Preferences PUT / GET
  app.get('/api/user/email-preferences', async (req, res) => {
    try {
      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let uid = (req.query.uid as string) || (req.headers['x-user-id'] as string) || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.uid) uid = decoded.uid;
        } catch {}
      }

      let preferences = {
        weeklyDigest: true,
        usageWarnings: true,
        marketing: true,
        billing: true,
        security: true,
      };

      if (uid) {
        const { getAdminDb } = await import('./src/lib/firebase-admin');
        const adminDb = getAdminDb();
        if (adminDb) {
          const snap = await adminDb.collection('users').doc(uid).get();
          if (snap.exists) {
            const data = snap.data();
            if (data?.settings?.emailPreferences) {
              preferences = { ...preferences, ...data.settings.emailPreferences, billing: true, security: true };
            }
          }
        }
      }

      return res.json({ success: true, preferences });
    } catch (err: any) {
      console.error('[server.ts email-preferences GET] Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch preferences' });
    }
  });

  app.put('/api/user/email-preferences', async (req, res) => {
    try {
      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let uid = (req.headers['x-user-id'] as string) || req.body?.uid || '';

      if (token) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin');
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.uid) uid = decoded.uid;
        } catch {}
      }

      if (!uid) {
        return res.status(401).json({ error: 'User identifier required' });
      }

      const { weeklyDigest = true, usageWarnings = true, marketing = true } = req.body || {};
      const emailPreferences = {
        weeklyDigest: Boolean(weeklyDigest),
        usageWarnings: Boolean(usageWarnings),
        marketing: Boolean(marketing),
        billing: true,
        security: true,
      };

      const { getAdminDb } = await import('./src/lib/firebase-admin');
      const adminDb = getAdminDb();
      if (adminDb && uid !== 'demo-user-123') {
        await adminDb.collection('users').doc(uid).set(
          {
            settings: {
              emailPreferences,
              weeklyDigest: Boolean(weeklyDigest),
            },
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      return res.json({ success: true, emailPreferences });
    } catch (err: any) {
      console.error('[server.ts email-preferences PUT] Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to update preferences' });
    }
  });

  // Daily Cron: Check Expiring Plans
  app.get('/api/cron/check-expiring-plans', async (req, res) => {
    try {
      const authHeader = (req.headers.authorization as string) || '';
      const cronSecret = process.env.CRON_SECRET;

      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
      }

      const { getAdminDb } = await import('./src/lib/firebase-admin');
      const { sendPlanExpiringSoonEmail } = await import('./src/lib/emailService');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://kdpstudio.com';

      const adminDb = getAdminDb();
      if (!adminDb) {
        return res.json({ message: 'Firestore Admin not initialized', checked: 0, warned: 0 });
      }

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const usersSnap = await adminDb.collection('users').get();
      let checkedCount = 0;
      let warnedCount = 0;

      for (const doc of usersSnap.docs) {
        const user = doc.data();
        if (!user.email || !user.plan || user.plan === 'free') continue;
        if (user.subscriptionCancelled === true) continue;

        if (user.planEndDate) {
          checkedCount++;
          const endDate = new Date(user.planEndDate);
          const msUntilExpiry = endDate.getTime() - now.getTime();
          const daysUntilExpiry = Math.ceil(msUntilExpiry / (24 * 60 * 60 * 1000));

          if (daysUntilExpiry > 0 && daysUntilExpiry <= 3) {
            let alreadyWarnedRecently = false;
            if (user.lastExpiryWarningDate) {
              const lastWarned = new Date(user.lastExpiryWarningDate);
              const daysSinceWarn = Math.floor((now.getTime() - lastWarned.getTime()) / (24 * 60 * 60 * 1000));
              if (daysSinceWarn < 7) alreadyWarnedRecently = true;
            }

            if (!alreadyWarnedRecently) {
              warnedCount++;
              const userName = user.name || user.displayName || user.email.split('@')[0];

              sendPlanExpiringSoonEmail({
                to: user.email,
                name: userName,
                plan: user.plan,
                expiresOn: endDate.toLocaleDateString(),
                daysLeft: daysUntilExpiry,
                renewUrl: `${appUrl}/pricing`,
              }).catch(console.error);

              await doc.ref.update({
                lastExpiryWarningDate: todayStr,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
      }

      return res.json({
        success: true,
        checked: checkedCount,
        warned: warnedCount,
        executedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[server.ts cron check-expiring-plans] Error:', err);
      return res.status(500).json({ error: err.message || 'Cron execution failed' });
    }
  });

  // Weekly Cron: Weekly Digest Dispatcher
  app.get('/api/cron/weekly-digest', async (req, res) => {
    try {
      const authHeader = (req.headers.authorization as string) || '';
      const cronSecret = process.env.CRON_SECRET;

      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
      }

      const { getAdminDb } = await import('./src/lib/firebase-admin');
      const { sendWeeklyDigestEmail } = await import('./src/lib/emailService');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://kdpstudio.com';

      const adminDb = getAdminDb();
      if (!adminDb) {
        return res.json({ message: 'Firestore Admin not initialized', sent: 0 });
      }

      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const daysSinceLastSunday = dayOfWeek === 0 ? 7 : dayOfWeek;
      const weekEnd = new Date(now.getTime() - daysSinceLastSunday * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);

      const WEEKLY_TIPS = [
        {
          title: 'Use long-tail keywords for better KDP ranking',
          body: "Instead of 'fitness book', try '30-day morning workout plan for busy moms'. Specific keywords have less competition and more buyer intent.",
          link: `${appUrl}/kdp`,
        },
        {
          title: 'Coloring books are the fastest KDP niche',
          body: "Low-content coloring books can be created in hours and require no writing. Adult coloring is consistently one of KDP's top categories.",
          link: `${appUrl}/studio`,
        },
        {
          title: 'Optimize your book description with HTML',
          body: 'KDP allows basic HTML in descriptions. Use <b>bold text</b> for key benefits and <br> for spacing. Our KDP Assistant does this automatically.',
          link: `${appUrl}/kdp`,
        },
        {
          title: 'Price your book between $2.99 and $9.99',
          body: "This range qualifies for KDP's 70% royalty rate. At $4.99 you earn ~$3.44 per sale vs $1.74 at $1.99.",
          link: `${appUrl}/kdp`,
        },
        {
          title: 'Series sell better than standalone books',
          body: 'Readers who buy book 1 of a series convert at 60%+ for book 2. Use our Series Manager to keep consistent branding across all books.',
          link: `${appUrl}/books`,
        },
        {
          title: 'Update your keywords every 90 days',
          body: "Amazon's search trends shift. Keywords that worked 3 months ago may be saturated now. Refresh all 7 keywords quarterly.",
          link: `${appUrl}/kdp`,
        },
        {
          title: 'Your cover is your #1 marketing tool',
          body: 'Readers decide in under 2 seconds. Thumbnail size matters most — test your cover at 80×120px to see if the title is still readable.',
          link: `${appUrl}/cover`,
        },
      ];

      const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
      const tip = WEEKLY_TIPS[weekNumber % WEEKLY_TIPS.length];

      const usersSnap = await adminDb.collection('users').get();
      let sentCount = 0;
      let errorCount = 0;

      for (const doc of usersSnap.docs) {
        const user = doc.data();
        if (!user.email) continue;
        if (user.settings?.emailPreferences?.weeklyDigest === false) continue;

        const userName = user.name || user.displayName || user.email.split('@')[0];
        const booksCreated = Number(user.usage?.allTime?.booksCreated || 0);
        const aiGenerations = Number(user.usage?.monthly?.aiGenerations || 0);
        const pdfsExported = Number(user.usage?.monthly?.pdfExports || 0);

        try {
          sendWeeklyDigestEmail({
            to: user.email,
            name: userName,
            weekStart: weekStart.toLocaleDateString(),
            weekEnd: weekEnd.toLocaleDateString(),
            booksCreated,
            aiGenerations,
            pdfsExported,
            currentPlan: user.plan || 'free',
            tipTitle: tip.title,
            tipBody: tip.body,
            tipLink: tip.link,
          }).catch(console.error);

          sentCount++;
        } catch (err) {
          errorCount++;
        }
      }

      return res.json({
        success: true,
        sent: sentCount,
        errors: errorCount,
        weekStart: weekStart.toLocaleDateString(),
        weekEnd: weekEnd.toLocaleDateString(),
        tipSelected: tip.title,
      });
    } catch (err: any) {
      console.error('[server.ts cron weekly-digest] Error:', err);
      return res.status(500).json({ error: err.message || 'Weekly digest execution failed' });
    }
  });

  // Usage Summary endpoint
  app.get('/api/user/usage', async (req, res) => {
    try {
      const uid = (req.query.uid as string) || (req.headers['x-user-id'] as string) || 'demo-user-123';
      const plan = (req.query.plan as string) || 'free';
      const summary = await getUserUsageSummary(uid, plan);
      return res.json({ success: true, summary });
    } catch (err: any) {
      console.error('Usage summary error:', err);
      return res.status(500).json({ error: 'Failed to retrieve usage' });
    }
  });

  // AI Image Generation endpoint for Cover Builder
  app.post('/api/generate-image', createExpressUsageMiddleware('imageGenerations'), async (req, res) => {
    try {
      const { prompt, aspectRatio, style, mood } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = getAiClient();
      const { generateCoverImageService } = await import('./server/coverServices');
      const result = await generateCoverImageService(ai, prompt, aspectRatio, style, mood);

      return res.json({
        success: true,
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
      });
    } catch (error: any) {
      console.error('Image generation error:', error);
      return res.status(500).json({ error: error.message || 'Image generation failed' });
    }
  });

  // AI Cover Style Suggestion endpoint
  app.post('/api/suggest-cover-style', createExpressUsageMiddleware('aiGenerations'), async (req, res) => {
    try {
      const { title, genre, subtitle } = req.body;
      const ai = getAiClient();
      const { suggestCoverStyleService } = await import('./server/coverServices');
      const suggestion = await suggestCoverStyleService(ai, title || 'Untitled', genre || 'General Fiction', subtitle);

      return res.json({ success: true, suggestion });
    } catch (error: any) {
      console.error('Cover style suggestion error:', error);
      return res.status(500).json({ error: error.message || 'Style suggestion failed' });
    }
  });

  // ================= KDP Assistant Endpoints =================
  // 1. Description Generator
  app.post('/api/kdp/description', createExpressUsageMiddleware('aiGenerations'), async (req, res) => {
    try {
      const { title, subtitle, genre, author, chapters, concept, targetAudience, tone } = req.body;
      const ai = getAiClient();

      if (!process.env.GEMINI_API_KEY) {
        // Fallback for preview
        const mockHtml = `<h2>An Unforgettable Journey Through Darkness and Wonder</h2>
<p>In a world where secrets shape empires and every shadow holds a debt, one unexpected choice changes everything. When destiny calls, the past refuses to stay buried.</p>
<p><b>Inside "${title || 'This Book'}", you will discover:</b></p>
<ul>
  <li><b>High-Stakes Intrigue:</b> A masterfully woven narrative packed with suspense, vivid characters, and relentless momentum.</li>
  <li><b>Rich Worldbuilding:</b> Immersive settings that pull you deep into the heart of the adventure.</li>
  <li><b>Unforgettable Twists:</b> Revelations that will keep you turning pages late into the night.</li>
</ul>
<p>Whether you're a devoted fan of ${genre || 'great storytelling'} or discovering this world for the first time, this is an adventure you cannot afford to miss.</p>
<p><b>Scroll up, click "Buy Now", and begin your journey today!</b></p>`;
        const plain = mockHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return res.json({
          success: true,
          htmlDescription: mockHtml,
          plainDescription: plain,
          wordCount: plain.split(/\s+/).filter(Boolean).length,
          charCount: mockHtml.length,
        });
      }

      const { generateBookDescriptionService } = await import('./server/kdpServices');
      const result = await generateBookDescriptionService(ai, {
        title: title || 'Untitled Book',
        subtitle,
        genre: genre || 'Fiction',
        author,
        chapters,
        concept,
        targetAudience,
        tone,
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('KDP Description error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to generate description' });
    }
  });

  // 2. Keywords Generator
  app.post('/api/kdp/keywords', createExpressUsageMiddleware('aiGenerations'), async (req, res) => {
    try {
      const { title, subtitle, genre, description } = req.body;
      const ai = getAiClient();

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          success: true,
          keywords: [
            { keyword: `${genre.toLowerCase()} bestselling novels 2025`, searchIntent: 'Commercial', competition: 'Medium', relevanceScore: 96, explanation: 'High commercial volume for category buyers' },
            { keyword: 'epic adventure story with plot twists', searchIntent: 'Transactional', competition: 'Low', relevanceScore: 94, explanation: 'Specific reader search trope' },
            { keyword: 'kindle unlimited fantasy books for adults', searchIntent: 'Transactional', competition: 'Medium', relevanceScore: 92, explanation: 'High buyer propensity in KU' },
            { keyword: 'immersive worldbuilding fiction series', searchIntent: 'Informational', competition: 'Low', relevanceScore: 90, explanation: 'Targeted niche query' },
            { keyword: 'fast paced psychological mystery novel', searchIntent: 'Commercial', competition: 'Medium', relevanceScore: 89, explanation: 'High conversion for thriller/mystery' },
            { keyword: 'hero journey coming of age epic', searchIntent: 'Commercial', competition: 'Low', relevanceScore: 88, explanation: 'Classic trope keyword' },
            { keyword: 'dark magic and political intrigue books', searchIntent: 'Transactional', competition: 'Low', relevanceScore: 87, explanation: 'Long-tail niche keyword' },
            { keyword: 'new releases in fantasy and scifi', searchIntent: 'Navigational', competition: 'High', relevanceScore: 85, explanation: 'Broad category discovery' },
            { keyword: 'gripping standalone fiction page turner', searchIntent: 'Commercial', competition: 'Medium', relevanceScore: 84, explanation: 'Broad reader preference' },
            { keyword: 'must read books for book clubs', searchIntent: 'Informational', competition: 'Medium', relevanceScore: 83, explanation: 'Discussion group search intent' },
          ],
        });
      }

      const { suggestKeywordsService } = await import('./server/kdpServices');
      const keywords = await suggestKeywordsService(ai, {
        title: title || 'Untitled',
        subtitle,
        genre: genre || 'Fiction',
        description,
      });

      return res.json({ success: true, keywords });
    } catch (err: any) {
      console.error('KDP Keywords error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to suggest keywords' });
    }
  });

  // 3. Categories Suggester
  app.post('/api/kdp/categories', createExpressUsageMiddleware('aiGenerations'), async (req, res) => {
    try {
      const { title, subtitle, genre, description } = req.body;
      const ai = getAiClient();

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          success: true,
          categories: [
            {
              bisacCode: 'FIC009020',
              categoryName: 'Fiction / Fantasy / Epic',
              amazonBrowsePath: 'Books > Science Fiction & Fantasy > Fantasy > Epic',
              competitionLevel: 'Medium',
              rankingViability: 'High (Achieve Top 10 with ~25 sales/day)',
              reason: 'Core genre match with strong algorithmic relevance and buyer activity.',
            },
            {
              bisacCode: 'FIC002000',
              categoryName: 'Fiction / Action & Adventure',
              amazonBrowsePath: 'Books > Literature & Fiction > Action & Adventure',
              competitionLevel: 'Low',
              rankingViability: 'Very High (Achieve #1 Orange Banner with ~15 sales/day)',
              reason: 'Excellent secondary sub-niche with low ranking saturation.',
            },
            {
              bisacCode: 'FIC028000',
              categoryName: 'Fiction / Science Fiction / Space Opera',
              amazonBrowsePath: 'Books > Science Fiction & Fantasy > Science Fiction > Space Opera',
              competitionLevel: 'Low',
              rankingViability: 'High (Great niche crossover potential)',
              reason: 'Captures readers looking for expansive scope and deep lore.',
            },
          ],
        });
      }

      const { suggestCategoriesService } = await import('./server/kdpServices');
      const categories = await suggestCategoriesService(ai, {
        title: title || 'Untitled',
        subtitle,
        genre: genre || 'Fiction',
        description,
      });

      return res.json({ success: true, categories });
    } catch (err: any) {
      console.error('KDP Categories error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to suggest categories' });
    }
  });

  // 4. Back Cover Blurb Generator
  app.post('/api/kdp/blurb', createExpressUsageMiddleware('aiGenerations'), async (req, res) => {
    try {
      const { title, subtitle, genre, summary, targetReader, problemOrConflict, benefits, authorBio, styleModifier } = req.body;
      const ai = getAiClient();

      if (!process.env.GEMINI_API_KEY) {
        const headline = 'AN IMPOSSIBLE CHOICE. AN UNFORGIVING WORLD.';
        const hookParagraph = `When the shadows of the past threaten to consume everything she has fought for, Elena must risk the one thing she cannot afford to lose: her own humanity.\n\nFaced with an enemy that knows her every move, she is thrust into a game of secrets and betrayal where survival demands the ultimate sacrifice.`;
        const bulletPoints = [
          'A breathless race against time across a decaying empire',
          'Intricate alliances where friend and foe blur into one',
          'A shocking climax that will leave you stunned',
        ];
        const callToAction = 'Step into an unforgettable world. Grab your copy today!';
        const authorBioSnippet = `${authorBio || 'A passionate writer who loves crafting immersive worlds and unforgettable characters.'}`;
        const fullBlurbFormatted = `${headline}\n\n${hookParagraph}\n\n${bulletPoints.map(b => `• ${b}`).join('\n')}\n\n${callToAction}\n\nAbout the Author:\n${authorBioSnippet}`;

        return res.json({
          success: true,
          headline,
          hookParagraph,
          bulletPoints,
          callToAction,
          authorBioSnippet,
          fullBlurbFormatted,
          wordCount: fullBlurbFormatted.split(/\s+/).filter(Boolean).length,
        });
      }

      const { generateBackCoverBlurbService } = await import('./server/kdpServices');
      const result = await generateBackCoverBlurbService(ai, {
        title: title || 'Untitled',
        subtitle,
        genre: genre || 'Fiction',
        summary,
        targetReader,
        problemOrConflict,
        benefits,
        authorBio,
        styleModifier,
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('KDP Blurb error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to generate blurb' });
    }
  });

  // 5. Title & Hook Analyzer
  app.post('/api/kdp/analyze-title', createExpressUsageMiddleware('aiGenerations'), async (req, res) => {
    try {
      const { title, subtitle, genre } = req.body;
      const ai = getAiClient();

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          success: true,
          overallScore: 88,
          scores: {
            memorability: 90,
            searchability: 82,
            genreClarity: 92,
            emotionalAppeal: 88,
          },
          verdict: 'Strong, evocative title with immediate genre punch and high reader intrigue.',
          strengths: [
            'Immediate atmospheric tone matches current bestseller trends',
            'Concise rhythm makes it easy to remember and recommend',
            'Strong visual imagery creates instant curiosity',
          ],
          improvements: [
            'Adding a targeted subtitle will boost Amazon organic search ranking',
            'Consider testing keyword-rich subtitle phrases for specific tropes',
          ],
          suggestedAlternatives: [
            {
              title: `${title || 'Echoes of the Forgotten'}`,
              subtitle: 'A Gripping Dark Fantasy Novel',
              rationale: 'Clarifies subgenre immediately on search result thumbnail cards.',
              conversionFactor: '+18% search CTR',
            },
            {
              title: `The Last ${title?.split(' ').pop() || 'Chronicle'}`,
              subtitle: 'An Epic Tale of Betrayal and Destiny',
              rationale: 'Elevates stakes and promises high drama.',
              conversionFactor: '+24% emotional resonance',
            },
            {
              title: `Shadows of ${title?.split(' ')[0] || 'Eternity'}`,
              subtitle: 'Book 1 of the Awakening Series',
              rationale: 'Prepares readers for a lucrative multi-book series experience.',
              conversionFactor: '+30% read-through value',
            },
          ],
        });
      }

      const { analyzeTitleService } = await import('./server/kdpServices');
      const result = await analyzeTitleService(ai, {
        title: title || 'Untitled',
        subtitle,
        genre: genre || 'Fiction',
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('KDP Title Analyzer error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to analyze title' });
    }
  });

  // Cover Export Endpoint (300 DPI PDF or JPG)
  app.post('/api/export-cover', createExpressUsageMiddleware('coverExports'), async (req, res) => {
    try {
      const { imageDataUrl, coverDimensions, exportFormat } = req.body;
      if (!imageDataUrl) {
        return res.status(400).json({ error: 'Cover image data is required' });
      }

      const widthInches = coverDimensions?.totalWidth || 12.8;
      const heightInches = coverDimensions?.totalHeight || 9.25;

      if (exportFormat === 'pdf') {
        let browser;
        try {
          const puppeteer = (await import('puppeteer')).default;
          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
          });

          const page = await browser.newPage();
          const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    @page {
      size: ${widthInches}in ${heightInches}in;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: ${widthInches}in;
      height: ${heightInches}in;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  </style>
</head>
<body>
  <img src="${imageDataUrl}" />
</body>
</html>`;

          await page.setContent(html, { waitUntil: 'networkidle0' });
          const pdfBuffer = await page.pdf({
            width: `${widthInches}in`,
            height: `${heightInches}in`,
            printBackground: true,
            margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' },
          });

          await browser.close();

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename="full_cover_kdp.pdf"');
          return res.send(Buffer.from(pdfBuffer));
        } catch (pdfErr: any) {
          if (browser) await browser.close().catch(() => {});
          console.error('Puppeteer cover PDF error:', pdfErr);
        }
      }

      // Default: Return high-res image data
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', exportFormat === 'jpg' || exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="cover_300dpi.${exportFormat === 'jpg' ? 'jpg' : 'png'}"`);
      return res.send(imageBuffer);
    } catch (err: any) {
      console.error('Export cover error:', err);
      return res.status(500).json({ error: err.message || 'Export cover failed' });
    }
  });

  // Server-side PDF export route
  app.post('/api/export-pdf', createExpressUsageMiddleware('pdfExports'), async (req, res) => {
    try {
      const { book, settings, margins, trimSize } = req.body;
      if (!book) {
        return res.status(400).json({ error: 'Book data is required' });
      }

      // Dynamic import to keep startup lightweight
      const { buildBookHtml } = await import('./server/htmlGenerator');
      const htmlContent = buildBookHtml(
        book,
        settings || {},
        margins || { top: 0.5, bottom: 0.75, inside: 0.5, outside: 0.25 },
        trimSize || { width: 6, height: 9 }
      );

      let browser;
      try {
        const puppeteer = (await import('puppeteer')).default;
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
          ],
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 30000 });

        const widthInInches = trimSize?.width || 6;
        const heightInInches = trimSize?.height || 9;

        const pdfBuffer = await page.pdf({
          width: `${widthInInches}in`,
          height: `${heightInInches}in`,
          printBackground: true,
          margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' },
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="interior.pdf"`
        );
        return res.send(Buffer.from(pdfBuffer));
      } catch (launchErr: any) {
        console.error('Puppeteer generation error:', launchErr);
        if (browser) {
          await browser.close().catch(() => {});
        }
        return res.status(500).json({
          error: 'Puppeteer generation error',
          message: launchErr.message,
          html: htmlContent,
        });
      }
    } catch (error: any) {
      console.error('Export PDF endpoint error:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Unified Gemini API endpoint
  app.post('/api/gemini', createExpressUsageMiddleware('aiGenerations'), async (req, res) => {
    try {
      const { action, prompt, systemInstruction, stream = false } = req.body;
      const ai = getAiClient();

      if (!process.env.GEMINI_API_KEY) {
        // Provide intelligent fallback for smooth previews if key is not yet configured
        if (action === 'title_ideas') {
          return res.json({
            success: true,
            titles: [
              { title: 'The Silent Hourglass', subtitle: 'A Journey Through Forgotten Horizons' },
              { title: 'Beyond the Iron Threshold', subtitle: 'Secrets of the Lost Citadel' },
              { title: 'Whispers in the Starlight', subtitle: 'Chronicles of an Unspoken Destiny' },
              { title: 'The Architect of Echoes', subtitle: 'Building Worlds from Shattered Truths' },
              { title: 'Mastering the Unseen Flow', subtitle: 'A Guide to Purpose, Focus, and Craft' },
            ],
          });
        }
        
        if (action === 'improve_text') {
          return res.json({
            success: true,
            text: `${prompt} (refined and polished for publication clarity).`,
          });
        }

        return res.json({
          success: true,
          text: `Here is your generated manuscript chapter:\n\n# Chapter Draft\n\nThe morning light broke across the distant valley, casting long golden silhouettes against the ancient stone walls. Every detail seemed sharper today, as if the entire world had been waiting for this exact moment.\n\nHe stepped forward, checking his notes one final time. There was no turning back now.`,
        });
      }

      // 1. Streaming response for writing/continuing
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: systemInstruction ? { systemInstruction } : undefined,
          });

          for await (const chunk of responseStream) {
            const chunkText = chunk.text || '';
            if (chunkText) {
              res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
          }

          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        } catch (streamErr: any) {
          console.error('Gemini stream error:', streamErr);
          res.write(`data: ${JSON.stringify({ error: streamErr.message || 'Streaming failed' })}\n\n`);
          res.end();
        }
        return;
      }

      // 2. Direct Content Generation
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      const text = response.text || '';

      if (action === 'title_ideas') {
        // Try parsing title ideas from response
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const titles: Array<{ title: string; subtitle: string }> = [];

        for (const line of lines) {
          const cleanLine = line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, '').trim();
          if (cleanLine.includes(' - ') || cleanLine.includes(': ')) {
            const parts = cleanLine.split(/ [-:] /);
            titles.push({
              title: parts[0].replace(/^["']|["']$/g, '').trim(),
              subtitle: (parts[1] || '').replace(/^["']|["']$/g, '').trim(),
            });
          } else if (cleanLine.length > 0) {
            titles.push({
              title: cleanLine.replace(/^["']|["']$/g, '').trim(),
              subtitle: 'A Novel',
            });
          }
          if (titles.length >= 5) break;
        }

        if (titles.length === 0) {
          titles.push({ title: text.slice(0, 40), subtitle: 'A Captivating Story' });
        }

        return res.json({ success: true, titles });
      }

      return res.json({ success: true, text });
    } catch (error: any) {
      console.error('Gemini API endpoint error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to communicate with Gemini API',
      });
    }
  });

  // Contact Form Submission
  app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    console.log(`[Contact Form] From: ${name || 'Anonymous'} <${email}> | Subject: ${subject}`);
    console.log(`Message: ${message}`);

    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required' });
    }

    try {
      const { sendContactFormEmail } = await import('./src/lib/emailService');
      sendContactFormEmail({
        fromName: name || 'Anonymous User',
        fromEmail: email,
        subject: subject || 'General Inquiry',
        message: message,
        timestamp: new Date().toISOString(),
      }).catch(console.error);
    } catch (e) {
      console.warn('[Contact Form] Email trigger notice:', e);
    }

    return res.json({ success: true, message: 'Inquiry received successfully' });
  });

  /* ─────────────────────────────────────────────────────────────
   * Puzzle & Activity Book Generators Endpoints (Phase 11)
   * ───────────────────────────────────────────────────────────── */

  // 1. Generate Words with Gemini
  app.post(
    '/api/puzzles/generate-words',
    createExpressUsageMiddleware('aiGenerations'),
    async (req, res) => {
      try {
        const { generateWordsHandler } = await import('./src/app/api/puzzles/generate-words/route');
        const words = await generateWordsHandler(req.body);
        return res.json({ success: true, words });
      } catch (err: any) {
        console.error('Express /api/puzzles/generate-words error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Word generation failed' });
      }
    }
  );

  // 2. Full Word Search Book Generation
  app.post(
    '/api/puzzles/word-search/generate',
    createExpressUsageMiddleware('puzzleGenerations'),
    async (req: any, res) => {
      try {
        const { bookId, settings } = req.body;
        const uid = req.auth?.uid || 'guest';
        const { runWordSearchGeneration } = await import('./src/app/api/puzzles/word-search/generate/route');
        const safeBookId = bookId || `puz_ws_${Date.now()}`;
        const result = await runWordSearchGeneration(safeBookId, settings, uid);
        return res.json(result);
      } catch (err: any) {
        console.error('Express /api/puzzles/word-search/generate error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Book generation failed' });
      }
    }
  );

  // 3. Server-Sent Events Progress Stream
  app.get('/api/puzzles/word-search/progress/:bookId', async (req, res) => {
    const { bookId } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const { activeGenerationProgress } = await import('./src/app/api/puzzles/word-search/generate/route');

    const interval = setInterval(() => {
      const progressData = activeGenerationProgress.get(bookId);
      if (progressData) {
        res.write(`data: ${JSON.stringify(progressData)}\n\n`);
        if (progressData.status === 'complete' || progressData.status === 'error') {
          clearInterval(interval);
          res.end();
        }
      }
    }, 500);

    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // 4. Puppeteer PDF Export for Word Search
  app.post('/api/puzzles/word-search/export-pdf', async (req, res) => {
    try {
      const { bookId } = req.body;
      if (!bookId) return res.status(400).json({ error: 'Missing bookId' });

      const { getPuzzleBook } = await import('./src/lib/puzzleService');
      const { generatePuzzleBookHtml, getTrimDimensions } = await import('./src/lib/puzzles/puzzlePdfRenderer');

      const book = await getPuzzleBook(bookId);
      if (!book) return res.status(404).json({ error: 'Puzzle book not found' });

      const html = generatePuzzleBookHtml(book, book.settings, book.pages);
      const { width, height } = getTrimDimensions(book.settings.trimSize || '8.5x11');

      let puppeteer: any;
      try {
        puppeteer = await import('puppeteer');
      } catch {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${book.settings.title || 'word_search'}.html"`);
        return res.send(html);
      }

      const browser = await puppeteer.default.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        width: `${width}in`,
        height: `${height}in`,
        printBackground: true,
        margin: { top: '0.5in', bottom: '0.6in', left: '0.5in', right: '0.5in' },
      });

      await browser.close();

      const safeTitle = (book.settings.title || 'word_search').toLowerCase().replace(/[^a-z0-9]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_interior.pdf"`);
      return res.send(pdfBuffer);
    } catch (err: any) {
      console.error('PDF export express error:', err);
      return res.status(500).json({ error: err.message || 'PDF generation failed' });
    }
  });

  // 5. Word Fit Full Book Generation
  app.post(
    '/api/puzzles/word-fit/generate',
    createExpressUsageMiddleware('puzzleGenerations'),
    async (req: any, res) => {
      try {
        const { bookId, settings } = req.body;
        const uid = req.auth?.uid || 'guest';
        const { runWordFitGeneration } = await import('./src/app/api/puzzles/word-fit/generate/route');
        const safeBookId = bookId || `puz_wf_${Date.now()}`;
        const result = await runWordFitGeneration(safeBookId, settings, uid);
        return res.json(result);
      } catch (err: any) {
        console.error('Express /api/puzzles/word-fit/generate error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Book generation failed' });
      }
    }
  );

  // 6. Word Fit Server-Sent Events Progress Stream
  app.get('/api/puzzles/word-fit/progress/:bookId', async (req, res) => {
    const { bookId } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const { activeWordFitGenerationProgress } = await import('./src/app/api/puzzles/word-fit/generate/route');

    const interval = setInterval(() => {
      const progressData = activeWordFitGenerationProgress.get(bookId);
      if (progressData) {
        res.write(`data: ${JSON.stringify(progressData)}\n\n`);
        if (progressData.status === 'complete' || progressData.status === 'error') {
          clearInterval(interval);
          res.end();
        }
      }
    }, 500);

    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // 7. Word Fit Puppeteer PDF Export
  app.post('/api/puzzles/word-fit/export-pdf', async (req, res) => {
    try {
      const { bookId } = req.body;
      if (!bookId) return res.status(400).json({ error: 'Missing bookId' });

      const { getPuzzleBook } = await import('./src/lib/puzzleService');
      const { generatePuzzleBookHtml, getTrimDimensions } = await import('./src/lib/puzzles/puzzlePdfRenderer');

      const book = await getPuzzleBook(bookId);
      if (!book) return res.status(404).json({ error: 'Puzzle book not found' });

      const html = generatePuzzleBookHtml(book, book.settings, book.pages);
      const { width, height } = getTrimDimensions(book.settings.trimSize || '8.5x11');

      let puppeteer: any;
      try {
        puppeteer = await import('puppeteer');
      } catch {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${book.settings.title || 'word_fit'}.html"`);
        return res.send(html);
      }

      const browser = await puppeteer.default.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        width: `${width}in`,
        height: `${height}in`,
        printBackground: true,
        margin: { top: '0.5in', bottom: '0.6in', left: '0.5in', right: '0.5in' },
      });

      await browser.close();

      const safeTitle = (book.settings.title || 'word_fit').toLowerCase().replace(/[^a-z0-9]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_interior.pdf"`);
      return res.send(pdfBuffer);
    } catch (err: any) {
      console.error('PDF export express error:', err);
      return res.status(500).json({ error: err.message || 'PDF generation failed' });
    }
  });

  // 8. Coloring Book Prompts Generation
  app.post(
    '/api/puzzles/coloring/generate-prompts',
    createExpressUsageMiddleware('aiGenerations'),
    async (req, res) => {
      try {
        const { generateColoringPromptsHandler } = await import('./src/app/api/puzzles/coloring/generate-prompts/route');
        const prompts = await generateColoringPromptsHandler(req.body);
        return res.json({ success: true, prompts });
      } catch (err: any) {
        console.error('Express /api/puzzles/coloring/generate-prompts error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Prompt generation failed' });
      }
    }
  );

  // 9. Coloring Book Full Generation
  app.post(
    '/api/puzzles/coloring/generate',
    createExpressUsageMiddleware('imageGenerations'),
    async (req: any, res) => {
      try {
        const { bookId, prompts, settings } = req.body;
        const uid = req.auth?.uid || 'guest';
        const { runColoringBookGeneration } = await import('./src/app/api/puzzles/coloring/generate/route');
        const safeBookId = bookId || `puz_col_${Date.now()}`;
        const result = await runColoringBookGeneration(safeBookId, prompts || [], settings, uid);
        return res.json(result);
      } catch (err: any) {
        console.error('Express /api/puzzles/coloring/generate error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Coloring generation failed' });
      }
    }
  );

  // 10. Coloring Book Server-Sent Events Progress Stream
  app.get('/api/puzzles/coloring/progress/:bookId', async (req, res) => {
    const { bookId } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const { activeColoringGenerationProgress } = await import('./src/app/api/puzzles/coloring/generate/route');

    const interval = setInterval(() => {
      const progressData = activeColoringGenerationProgress.get(bookId);
      if (progressData) {
        res.write(`data: ${JSON.stringify(progressData)}\n\n`);
        if (progressData.status === 'complete' || progressData.status === 'error') {
          clearInterval(interval);
          res.end();
        }
      }
    }, 500);

    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // 11. Coloring Book Puppeteer PDF Export
  app.post('/api/puzzles/coloring/export-pdf', async (req, res) => {
    try {
      const { bookId } = req.body;
      if (!bookId) return res.status(400).json({ error: 'Missing bookId' });

      const { getPuzzleBook } = await import('./src/lib/puzzleService');
      const { generatePuzzleBookHtml, getTrimDimensions } = await import('./src/lib/puzzles/puzzlePdfRenderer');

      const book = await getPuzzleBook(bookId);
      if (!book) return res.status(404).json({ error: 'Puzzle book not found' });

      const html = generatePuzzleBookHtml(book, book.settings, book.pages);
      const { width, height } = getTrimDimensions(book.settings.trimSize || '8.5x8.5');

      let puppeteer: any;
      try {
        puppeteer = await import('puppeteer');
      } catch {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${book.settings.title || 'coloring_book'}.html"`);
        return res.send(html);
      }

      const browser = await puppeteer.default.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        width: `${width}in`,
        height: `${height}in`,
        printBackground: true,
        margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' },
      });

      await browser.close();

      const safeTitle = (book.settings.title || 'coloring_book').toLowerCase().replace(/[^a-z0-9]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_interior.pdf"`);
      return res.send(pdfBuffer);
    } catch (err: any) {
      console.error('PDF export express error:', err);
      return res.status(500).json({ error: err.message || 'PDF generation failed' });
    }
  });

  // 12. Color by Number Scene Generation
  app.post(
    '/api/puzzles/color-by-number/generate-scene',
    createExpressUsageMiddleware('aiGenerations'),
    async (req, res) => {
      try {
        const { generateSceneHandler } = await import('./src/app/api/puzzles/color-by-number/generate-scene/route');
        const scene = await generateSceneHandler(req.body);
        return res.json({ success: true, scene });
      } catch (err: any) {
        console.error('Express /api/puzzles/color-by-number/generate-scene error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Scene generation failed' });
      }
    }
  );

  // 13. Color by Number Full Generation
  app.post(
    '/api/puzzles/color-by-number/generate',
    createExpressUsageMiddleware('puzzleGenerations'),
    async (req: any, res) => {
      try {
        const { bookId, settings, sceneDescriptions } = req.body;
        const uid = req.auth?.uid || 'guest';
        const { runColorByNumberBookGeneration } = await import('./src/app/api/puzzles/color-by-number/generate/route');
        const safeBookId = bookId || `puz_cbn_${Date.now()}`;
        const result = await runColorByNumberBookGeneration(safeBookId, settings, sceneDescriptions || [], uid);
        return res.json(result);
      } catch (err: any) {
        console.error('Express /api/puzzles/color-by-number/generate error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Color by Number generation failed' });
      }
    }
  );

  // 14. Color by Number Server-Sent Events Progress Stream
  app.get('/api/puzzles/color-by-number/progress/:bookId', async (req, res) => {
    const { bookId } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const { activeColorByNumberGenerationProgress } = await import('./src/app/api/puzzles/color-by-number/generate/route');

    const interval = setInterval(() => {
      const progressData = activeColorByNumberGenerationProgress.get(bookId);
      if (progressData) {
        res.write(`data: ${JSON.stringify(progressData)}\n\n`);
        if (progressData.status === 'complete' || progressData.status === 'error') {
          clearInterval(interval);
          res.end();
        }
      }
    }, 500);

    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // 15. Color by Number Puppeteer PDF Export
  app.post('/api/puzzles/color-by-number/export-pdf', async (req, res) => {
    try {
      const { bookId } = req.body;
      if (!bookId) return res.status(400).json({ error: 'Missing bookId' });

      const { getPuzzleBook } = await import('./src/lib/puzzleService');
      const { generatePuzzleBookHtml, getTrimDimensions } = await import('./src/lib/puzzles/puzzlePdfRenderer');

      const book = await getPuzzleBook(bookId);
      if (!book) return res.status(404).json({ error: 'Puzzle book not found' });

      const html = generatePuzzleBookHtml(book, book.settings, book.pages);
      const { width, height } = getTrimDimensions(book.settings.trimSize || '8.5x11');

      let puppeteer: any;
      try {
        puppeteer = await import('puppeteer');
      } catch {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${book.settings.title || 'color_by_number'}.html"`);
        return res.send(html);
      }

      const browser = await puppeteer.default.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        width: `${width}in`,
        height: `${height}in`,
        printBackground: true,
        margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' },
      });

      await browser.close();

      const safeTitle = (book.settings.title || 'color_by_number').toLowerCase().replace(/[^a-z0-9]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_interior.pdf"`);
      return res.send(pdfBuffer);
    } catch (err: any) {
      console.error('PDF export express error:', err);
      return res.status(500).json({ error: err.message || 'PDF generation failed' });
    }
  });

  // 16. Brand Kit AI Bio Generator
  app.post(
    '/api/brand/generate-bio',
    createExpressUsageMiddleware('aiGenerations'),
    async (req, res) => {
      try {
        const { generateBioHandler } = await import('./src/app/api/brand/generate-bio/route');
        const result = await generateBioHandler(req.body);
        return res.json({ success: true, ...result });
      } catch (err: any) {
        console.error('Express /api/brand/generate-bio error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Bio generation failed' });
      }
    }
  );

  // 17. Brand Kit AI Palette Generator
  app.post(
    '/api/brand/generate-palette',
    createExpressUsageMiddleware('aiGenerations'),
    async (req, res) => {
      try {
        const { generatePaletteHandler } = await import('./src/app/api/brand/generate-palette/route');
        const palette = await generatePaletteHandler(req.body);
        return res.json({ success: true, palette });
      } catch (err: any) {
        console.error('Express /api/brand/generate-palette error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Palette generation failed' });
      }
    }
  );

  // 18. Series Bible PDF Export
  app.post(
    '/api/series/export-bible',
    createExpressUsageMiddleware('pdfExports'),
    async (req, res) => {
      try {
        const { exportSeriesBibleHandler } = await import('./src/app/api/series/export-bible/route');
        const result = await exportSeriesBibleHandler(req.body);
        if (result.pdfBuffer) {
          const safeTitle = (result.title || 'series_bible').toLowerCase().replace(/[^a-z0-9]/g, '_');
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_series_bible.pdf"`);
          return res.send(result.pdfBuffer);
        }
        res.setHeader('Content-Type', 'text/html');
        return res.send(result.html);
      } catch (err: any) {
        console.error('Express /api/series/export-bible error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Series bible export failed' });
      }
    }
  );

  // 19. Series AI Suggest Title
  app.post(
    '/api/series/suggest-title',
    createExpressUsageMiddleware('aiGenerations'),
    async (req, res) => {
      try {
        const { suggestSeriesTitlesHandler } = await import('./src/app/api/series/suggest-title/route');
        const result = await suggestSeriesTitlesHandler(req.body);
        return res.json({ success: true, ...result });
      } catch (err: any) {
        console.error('Express /api/series/suggest-title error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Title suggestion failed' });
      }
    }
  );

  // 20. Series AI Generate Description
  app.post(
    '/api/series/generate-description',
    createExpressUsageMiddleware('aiGenerations'),
    async (req, res) => {
      try {
        const { generateSeriesDescriptionHandler } = await import('./src/app/api/series/generate-description/route');
        const result = await generateSeriesDescriptionHandler(req.body);
        return res.json({ success: true, ...result });
      } catch (err: any) {
        console.error('Express /api/series/generate-description error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Description generation failed' });
      }
    }
  );

  // 21. Niche AI Market Analysis (Phase 13A)
  app.post(
    '/api/niche/analyze',
    createExpressUsageMiddleware('aiGenerations'),
    async (req: any, res) => {
      try {
        const { analyzeNichesHandler } = await import('./src/app/api/niche/analyze/route');
        const userContext = req.auth || {
          uid: (req.headers['x-user-id'] as string) || req.body?.uid || 'demo-user-123',
          plan: 'pro',
        };
        const result = await analyzeNichesHandler(req.body, userContext);
        return res.json({ success: true, ...result });
      } catch (err: any) {
        console.error('Express /api/niche/analyze error:', err);
        const isRateLimit = err.message?.includes('HOURLY_RATE_LIMIT');
        return res.status(isRateLimit ? 429 : 500).json({
          success: false,
          error: err.message || 'Niche analysis failed',
          code: isRateLimit ? 'HOURLY_RATE_LIMIT' : 'ANALYSIS_FAILED',
        });
      }
    }
  );

  // 22. Quick Niche Score (Phase 13A)
  app.post(
    '/api/niche/quick-score',
    createExpressUsageMiddleware('aiGenerations'),
    async (req, res) => {
      try {
        const { quickScoreHandler } = await import('./src/app/api/niche/quick-score/route');
        const result = await quickScoreHandler(req.body);
        return res.json({ success: true, ...result });
      } catch (err: any) {
        console.error('Express /api/niche/quick-score error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Quick score failed' });
      }
    }
  );

  // 23. Trending Niches (Phase 13A)
  app.get('/api/niche/trending', async (req, res) => {
    try {
      const { getTrendingNichesHandler } = await import('./src/app/api/niche/trending/route');
      const data = await getTrendingNichesHandler();
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.json({ success: true, ...data });
    } catch (err: any) {
      console.error('Express /api/niche/trending error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch trending niches' });
    }
  });

  // 24. Cron: Refresh Trending Niches (Phase 13A)
  app.get('/api/cron/refresh-trending-niches', async (req, res) => {
    try {
      const authHeader = (req.headers.authorization as string) || '';
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
      }
      const { generateTrendingNiches } = await import('./src/app/api/niche/trending/route');
      const data = await generateTrendingNiches();
      return res.json({
        success: true,
        count: data.niches.length,
        updatedAt: data.updatedAt,
        nextUpdate: data.nextUpdate,
        executedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Express /api/cron/refresh-trending-niches error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal cron error' });
    }
  });

  // 25. Start Book from Niche (Phase 13B)
  app.post(
    '/api/niche/start-book',
    createExpressUsageMiddleware('aiGenerations'),
    async (req: any, res) => {
      try {
        const { startBookFromNicheHandler } = await import('./src/app/api/niche/start-book/route');
        const userContext = req.auth || {
          uid: (req.headers['x-user-id'] as string) || req.body?.uid || 'demo-user-123',
          email: req.auth?.email || 'author@kdpstudio.com',
        };
        const result = await startBookFromNicheHandler(req.body, userContext);
        return res.json({ success: true, ...result });
      } catch (err: any) {
        console.error('Express /api/niche/start-book error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to start book from niche' });
      }
    }
  );

  // 26. Bulk Variables AI Resolver (Phase 14A)
  app.post(
    '/api/bulk/resolve-variables',
    createExpressUsageMiddleware('aiGenerations'),
    async (req: any, res) => {
      try {
        const { resolveVariablesHandler } = await import('./src/app/api/bulk/resolve-variables/route');
        const userContext = req.auth || {
          uid: (req.headers['x-user-id'] as string) || req.body?.uid || 'demo-user-123',
          email: req.auth?.email || 'author@kdpstudio.com',
        };
        const result = await resolveVariablesHandler(req.body, userContext);
        return res.json({ success: true, ...result });
      } catch (err: any) {
        console.error('Express /api/bulk/resolve-variables error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to resolve variables' });
      }
    }
  );

  // 27. Bulk Job Processor with SSE Stream (Phase 14A)
  app.post(
    '/api/bulk/process/:jobId',
    async (req: any, res) => {
      const jobId = req.params.jobId;
      const userContext = req.auth || {
        uid: (req.headers['x-user-id'] as string) || req.body?.uid || 'demo-user-123',
        email: req.auth?.email || 'author@kdpstudio.com',
      };

      const acceptsSSE = req.headers.accept?.includes('text/event-stream');

      if (acceptsSSE) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        try {
          const { processBulkJobHandler } = await import('./src/app/api/bulk/process/[jobId]/route');
          await processBulkJobHandler(jobId, userContext, (event) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          });
          res.end();
        } catch (err: any) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
          res.end();
        }
      } else {
        try {
          const { processBulkJobHandler } = await import('./src/app/api/bulk/process/[jobId]/route');
          const result = await processBulkJobHandler(jobId, userContext);
          return res.json({ success: true, ...result });
        } catch (err: any) {
          console.error('Express /api/bulk/process error:', err);
          return res.status(500).json({ success: false, error: err.message || 'Failed to process bulk job' });
        }
      }
    }
  );

  // 28. Bulk Export ZIP (Phase 14A)
  app.post(
    '/api/bulk/export-zip/:jobId',
    async (req: any, res) => {
      try {
        const jobId = req.params.jobId;
        const { exportZipHandler } = await import('./src/lib/bulk/zipService');
        const userContext = req.auth || {
          uid: (req.headers['x-user-id'] as string) || req.body?.uid || 'demo-user-123',
          email: req.auth?.email || 'author@kdpstudio.com',
        };
        const result = await exportZipHandler(jobId, userContext);
        return res.json({ success: true, ...result });
      } catch (err: any) {
        console.error('Express /api/bulk/export-zip error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to export ZIP' });
      }
    }
  );

  // 29. Bulk Retry Variation (Phase 14B)
  app.post(
    '/api/bulk/retry-variation',
    async (req: any, res) => {
      try {
        const { retryVariationHandler } = await import('./src/app/api/bulk/retry-variation/route');
        const userContext = req.auth || {
          uid: (req.headers['x-user-id'] as string) || req.body?.uid || 'demo-user-123',
          email: req.auth?.email || 'author@kdpstudio.com',
        };
        const result = await retryVariationHandler(req.body, userContext);
        return res.json({ success: true, ...result });
      } catch (err: any) {
        console.error('Express /api/bulk/retry-variation error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to retry variation' });
      }
    }
  );

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KDP Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

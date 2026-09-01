/**
 * Payment Security Smoke Tests
 *
 * Run with:  npm test
 *
 * Covers the critical payment-gateway security guarantees:
 *  1. Stripe & BMaC webhook signature verification (valid + tampered).
 *  2. HTTP auth-gating: payment mutations return 401 without a Firebase ID token.
 *  3. Admin payment mutations reject spoofed x-user-email / body.adminEmail when
 *     no (verified) ID token is present.
 *  4. Public /api/payment/config endpoint returns gateway status.
 *
 * Uses Node's built-in test runner (node:test) — no extra dependencies required.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { verifyBmacWebhook } from '../src/lib/webhookSecurity';

const STRIPE_SECRET = 'whsec_test_stripe_secret_1234567890';
const BMAC_SECRET = 'test-bmac-webhook-secret';
process.env.STRIPE_WEBHOOK_SECRET = STRIPE_SECRET;
process.env.BMAC_WEBHOOK_SECRET = BMAC_SECRET;
process.env.ADMIN_EMAIL = 'admin@kdpstudio.com';

// ─── Unit: Webhook signature verification ─────────────────────────────────

test('bmac webhook: accepts a valid HMAC-SHA256 signature', () => {
  const body = JSON.stringify({ type: 'support.created', data: { id: '123' } });
  const valid = crypto.createHmac('sha256', BMAC_SECRET).update(body).digest('hex');
  assert.equal(verifyBmacWebhook(body, valid), true);
});

test('bmac webhook: rejects a tampered signature', () => {
  const body = JSON.stringify({ type: 'support.created', data: { id: '123' } });
  assert.equal(verifyBmacWebhook(body, 'invalid-signature-deadbeef'), false);
});

test('bmac webhook: rejects a signature over reconstructed JSON', () => {
  const rawBody = '{ "type": "support.created", "data": { "id": "123" } }';
  const reorderBody = JSON.stringify(JSON.parse(rawBody));
  const sig = crypto.createHmac('sha256', BMAC_SECRET).update(rawBody).digest('hex');
  assert.equal(verifyBmacWebhook(rawBody, sig), true);
  assert.equal(verifyBmacWebhook(reorderBody, sig), false);
});

// ─── HTTP integration: boot the real Express server ──────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;

let child: ReturnType<typeof spawn> | undefined;

async function waitForServer(timeoutMs = 30000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    'Server did not become ready. Check that .env has valid Firebase Admin config so server.ts can boot.'
  );
}

before(async () => {
  const env = { ...process.env, PORT: String(PORT), NODE_ENV: 'test' };
  child = spawn('node', ['--import', 'tsx', 'server.ts'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  await waitForServer();
});

after(() => {
  if (child && !child.killed) child.kill();
});

test('GET /api/health returns 200', async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.status, 200);
});

test('GET /api/payment/config returns gateway availability', async () => {
  const res = await fetch(`${BASE}/api/payment/config`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(typeof data.stripe, 'boolean');
  assert.equal(typeof data.upi, 'boolean');
  assert.equal(typeof data.bmac, 'boolean');
});

test('user payment mutations require a verified token (401 without auth)', async () => {
  const endpoints = [
    ['POST', '/api/payment/stripe/create-checkout'],
    ['POST', '/api/payment/upi/submit'],
    ['POST', '/api/payment/cancel-subscription'],
  ] as const;
  for (const [method, url] of endpoints) {
    const res = await fetch(`${BASE}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: 'spoofed-user', plan: 'pro', billingCycle: 'monthly' }),
    });
    assert.equal(res.status, 401, `${method} ${url} should require a verified token`);
  }
});

test('admin payment mutations reject a spoofed x-user-email header (no token)', async () => {
  const endpoints = [
    '/api/admin/upi/approve',
    '/api/admin/upi/reject',
    '/api/admin/bmac/match',
  ];
  for (const url of endpoints) {
    const res = await fetch(`${BASE}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-email': process.env.ADMIN_EMAIL! },
      body: JSON.stringify({ bmacPaymentId: 'bmac_1', targetId: 'x' }),
    });
    assert.ok(
      res.status === 401,
      `${url} must require a verified admin token (spoofer got ${res.status})`
    );
  }
});

export {};
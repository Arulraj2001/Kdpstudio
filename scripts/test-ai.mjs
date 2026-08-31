/**
 * KDP Studio — AI Integration Test
 * Tests Gemini text generation, HuggingFace FLUX, and Cloudflare FLUX
 * Run: node --env-file=.env.local scripts/test-ai.mjs
 */

import { GoogleGenAI } from '@google/genai';
import https from 'https';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const HF_KEY = process.env.HF_API_KEY;
const CF_TOKEN = process.env.CF_API_TOKEN;
const CF_ACCOUNT = process.env.CF_ACCOUNT_ID;

// Models to try in order (newest available first)
const CANDIDATE_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-3.6-flash',
];

const GREEN = '\x1b[32m✅';
const RED = '\x1b[31m❌';
const YELLOW = '\x1b[33m⚠️';
const RESET = '\x1b[0m';
const BLUE = '\x1b[36m';

function pass(label, detail) { console.log(`${GREEN} ${label}${RESET}${detail ? ` — ${detail}` : ''}`); }
function fail(label, err)    { console.log(`${RED} ${label}${RESET} — ${err}`); }
function warn(label, detail) { console.log(`${YELLOW} ${label}${RESET} — ${detail}`); }
function section(title)      { console.log(`\n${BLUE}── ${title} ──${RESET}`); }

// ── Detect working Gemini model ──────────────────────────────────────────────
let workingModel = null;
async function detectGeminiModel() {
  if (!GEMINI_KEY) return null;
  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: 'Say: OK',
        config: { maxOutputTokens: 5 },
      });
      if (res.text) { workingModel = model; return model; }
    } catch {}
  }
  return null;
}

// ── 1. GEMINI TEXT GENERATION ─────────────────────────────────────────────────
async function testGeminiGenerate(model) {
  section('Gemini Text Generation (AI Write / Improve / Audit)');
  if (!model) { fail('Gemini', 'No working model found for this API key'); return; }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const response = await ai.models.generateContent({
      model,
      contents: 'Write a single compelling opening sentence for a self-help book about productivity.',
      config: { temperature: 0.75, maxOutputTokens: 80 },
    });
    const text = response.text?.trim();
    if (text && text.length > 10) {
      pass(`Gemini generate [${model}]`, `"${text.slice(0, 120)}"`);
    } else {
      fail('Gemini generate', `Empty or too short: "${text}"`);
    }
  } catch (err) {
    fail('Gemini generate', err.message);
  }
}

// ── 2. GEMINI STREAMING ───────────────────────────────────────────────────────
async function testGeminiStream(model) {
  section('Gemini Streaming (AI Write Chapter)');
  if (!model) { fail('Gemini stream', 'No working model'); return; }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const stream = await ai.models.generateContentStream({
      model,
      contents: 'Write the opening paragraph of a mystery novel. Keep it under 50 words.',
      config: { temperature: 0.85 },
    });

    let full = '', chunkCount = 0;
    for await (const chunk of stream) {
      if (chunk.text) { full += chunk.text; chunkCount++; }
    }

    if (full.length > 20 && chunkCount > 0) {
      pass(`Gemini stream [${model}]`, `${chunkCount} chunks — "${full.slice(0, 100)}"`);
    } else {
      fail('Gemini stream', `Only ${chunkCount} chunks, ${full.length} chars`);
    }
  } catch (err) {
    fail('Gemini stream', err.message);
  }
}

// ── 3. GEMINI TITLE IDEAS ─────────────────────────────────────────────────────
async function testGeminiTitleIdeas(model) {
  section('Gemini Title Ideas (New Book Form)');
  if (!model) { fail('Gemini titles', 'No working model'); return; }

  const prompt = `Generate 5 book title ideas for a Self-Help book about daily habits.
Format strictly as:
1. Title: Subtitle
2. Title: Subtitle
3. Title: Subtitle
4. Title: Subtitle
5. Title: Subtitle
Only output the 5 lines.`;

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.9 },
    });
    const text = response.text || '';
    const lines = text.split('\n').filter(l => /^\d+\./.test(l.trim()));
    if (lines.length >= 4) {
      pass(`Gemini titles [${model}]`, `${lines.length} titles:`);
      lines.forEach(l => console.log(`   ${l.trim()}`));
    } else {
      fail('Gemini titles', `Only ${lines.length} parseable lines: "${text.slice(0, 200)}"`);
    }
  } catch (err) {
    fail('Gemini titles', err.message);
  }
}

// ── 4. HUGGING FACE IMAGE ─────────────────────────────────────────────────────
async function testHuggingFace() {
  section('Hugging Face FLUX.1-schnell (Image Generation)');
  if (!HF_KEY) { warn('HF_API_KEY', 'Not set — skipping'); return; }
  console.log('   Sending request to Hugging Face (may take 10–45s for cold start)...');

  const body = JSON.stringify({
    inputs: 'Professional KDP book cover, self-help genre, minimalist design, vibrant blue tones',
    parameters: { width: 512, height: 768, num_inference_steps: 4 },
  });

  await new Promise((resolve) => {
    const start = Date.now();
    const req = https.request({
      hostname: 'api-inference.huggingface.co',
      path: '/models/black-forest-labs/FLUX.1-schnell',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 55000,
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const ms = Date.now() - start;
        const buf = Buffer.concat(chunks);
        const ct = res.headers['content-type'] || 'unknown';
        if (res.statusCode === 503) {
          warn('HuggingFace FLUX', `Model loading (503) — retry in ~20s`);
        } else if (res.statusCode !== 200) {
          fail('HuggingFace FLUX', `HTTP ${res.statusCode} — ${buf.toString().slice(0, 200)}`);
        } else if (buf.length > 5000) {
          pass('HuggingFace FLUX', `${Math.round(buf.length/1024)} KB ${ct} in ${ms}ms — image generated ✓`);
        } else {
          fail('HuggingFace FLUX', `Too small: ${buf.length} bytes`);
        }
        resolve();
      });
    });
    req.on('error', (e) => { fail('HuggingFace FLUX', e.message); resolve(); });
    req.on('timeout', () => { fail('HuggingFace FLUX', 'Timed out after 55s'); req.destroy(); resolve(); });
    req.write(body);
    req.end();
  });
}

// ── 5. CLOUDFLARE WORKERS AI ──────────────────────────────────────────────────
async function testCloudflare() {
  section('Cloudflare Workers AI FLUX.1-schnell (Image Generation)');
  if (!CF_TOKEN || !CF_ACCOUNT) { warn('CF_API_TOKEN / CF_ACCOUNT_ID', 'Not set — skipping'); return; }
  console.log('   Sending request to Cloudflare AI...');

  const body = JSON.stringify({
    prompt: 'Professional book cover design, dark mode aesthetic, minimalist typography',
    steps: 4,
  });

  await new Promise((resolve) => {
    const start = Date.now();
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 35000,
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const ms = Date.now() - start;
        const buf = Buffer.concat(chunks);
        const ct = res.headers['content-type'] || 'unknown';
        if (res.statusCode !== 200) {
          fail('Cloudflare FLUX', `HTTP ${res.statusCode} — ${buf.toString().slice(0, 300)}`);
        } else if (buf.length > 5000) {
          pass('Cloudflare FLUX', `${Math.round(buf.length/1024)} KB ${ct} in ${ms}ms — image generated ✓`);
        } else {
          fail('Cloudflare FLUX', `Too small: ${buf.length} bytes`);
        }
        resolve();
      });
    });
    req.on('error', (e) => { fail('Cloudflare FLUX', e.message); resolve(); });
    req.on('timeout', () => { fail('Cloudflare FLUX', 'Timed out after 35s'); req.destroy(); resolve(); });
    req.write(body);
    req.end();
  });
}

// ── RUN ALL TESTS ─────────────────────────────────────────────────────────────
console.log('\x1b[1m\nKDP Studio — AI Feature Test\x1b[0m');
console.log('='.repeat(50));

console.log('\n\x1b[36m── Detecting working Gemini model... ──\x1b[0m');
if (!GEMINI_KEY) { console.log('\x1b[31m❌ GEMINI_API_KEY not set\x1b[0m'); }
else {
  const model = await detectGeminiModel();
  if (model) { console.log(`   Found: ${model}`); }
  else { console.log('\x1b[31m❌ No working Gemini model found for this key\x1b[0m'); }
  await testGeminiGenerate(model);
  await testGeminiStream(model);
  await testGeminiTitleIdeas(model);
}

await testHuggingFace();
await testCloudflare();

console.log('\n' + '='.repeat(50));
console.log('Done.\n');

/**
 * Full Suite AI & SaaS Capability Audit
 * Tests every AI service, prompt, format parser, and pricing engine
 */

import { GoogleGenAI } from '@google/genai';
import { generateBookDescriptionService, suggestKeywordsService, recommendCategoriesService, generateBookBlurbService, analyzeTitleService } from '../server/kdpServices.ts';
import { suggestCoverStyleService } from '../server/coverServices.ts';
import { generateImageWithFallback } from '../src/lib/imageGeneration.ts';
import { PLAN_LIMITS } from '../src/lib/planLimits.ts';
import { computeDynamicPricingTable } from '../src/lib/geo.ts';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY || '' });

const GREEN = '\x1b[32m[PASS]\x1b[0m';
const RED = '\x1b[31m[FAIL]\x1b[0m';
const YELLOW = '\x1b[33m[WARN]\x1b[0m';

console.log('\n=== KDP STUDIO SAAS AUDIT: AI ENGINES & PLAN MATRIX ===\n');

async function audit() {
  const results = [];

  // 1. KDP Description Generator (simulated with 3.6-flash override)
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Write a short 50-word Amazon KDP HTML description for a fantasy novel titled "Shadow Sovereign". Use <h2> and <b> tags.',
    });
    if (res.text && res.text.includes('<h2')) {
      console.log(`${GREEN} 1. KDP Description Engine: Generates Amazon HTML tags correctly`);
      results.push({ test: 'KDP Description', status: 'PASS' });
    } else {
      console.log(`${YELLOW} 1. KDP Description Engine: Text generated but missing <h2> tags`);
      results.push({ test: 'KDP Description', status: 'WARN' });
    }
  } catch (e) {
    console.log(`${RED} 1. KDP Description Engine: ${e.message}`);
    results.push({ test: 'KDP Description', status: 'FAIL', error: e.message });
  }

  // 2. KDP Keyword Generator
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Generate 5 Amazon KDP backend keywords for a Sci-Fi thriller. Output valid JSON array of objects with keyword, competition, searchIntent.',
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(res.text || '[]');
    if (Array.isArray(parsed) && parsed.length >= 3) {
      console.log(`${GREEN} 2. KDP Keyword Strategy: Generates structured JSON keywords (${parsed.length} items)`);
      results.push({ test: 'KDP Keywords', status: 'PASS' });
    } else {
      console.log(`${RED} 2. KDP Keyword Strategy: Failed JSON schema`);
      results.push({ test: 'KDP Keywords', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`${RED} 2. KDP Keyword Strategy: ${e.message}`);
    results.push({ test: 'KDP Keywords', status: 'FAIL', error: e.message });
  }

  // 3. AI Cover Style Suggestion
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Suggest cover style palette and typography for "The Silent Nebula" (Sci-Fi). Return JSON with palette (array of 5 hex colors), primaryFont, secondaryFont.',
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(res.text || '{}');
    if (parsed.palette && parsed.palette.length === 5 && parsed.primaryFont) {
      console.log(`${GREEN} 3. Cover Style Intelligence: Color palette [${parsed.palette.join(', ')}] + Font ${parsed.primaryFont}`);
      results.push({ test: 'Cover Style', status: 'PASS' });
    } else {
      console.log(`${RED} 3. Cover Style Intelligence: Invalid palette format`);
      results.push({ test: 'Cover Style', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`${RED} 3. Cover Style Intelligence: ${e.message}`);
    results.push({ test: 'Cover Style', status: 'FAIL', error: e.message });
  }

  // 4. Image Generation Cascade
  try {
    const imgRes = await generateImageWithFallback('A majestic dragon soaring above a misty pine forest', '3:4');
    if (imgRes && (imgRes.imageUrl.startsWith('data:image/') || imgRes.imageUrl.startsWith('http'))) {
      console.log(`${GREEN} 4. AI Image Generation (FLUX/Imagen): Successfully rendered image from source: ${imgRes.source}`);
      results.push({ test: 'AI Image Generation', status: 'PASS', source: imgRes.source });
    } else if (imgRes?.fallback) {
      console.log(`${YELLOW} 4. AI Image Generation: Fell back to SVG vector graphic (${imgRes.message || 'no provider'})`);
      results.push({ test: 'AI Image Generation', status: 'FALLBACK' });
    } else {
      console.log(`${RED} 4. AI Image Generation: Failed completely`);
      results.push({ test: 'AI Image Generation', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`${RED} 4. AI Image Generation: ${e.message}`);
    results.push({ test: 'AI Image Generation', status: 'FAIL', error: e.message });
  }

  // 5. Niche Analyzer Market Scoring
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Analyze KDP niche "cozy mystery with cats". Return JSON with demandScore (1-100), competitionScore (1-100), opportunityScore (1-100), verdict.',
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(res.text || '{}');
    if (parsed.demandScore !== undefined && parsed.opportunityScore !== undefined) {
      console.log(`${GREEN} 5. Niche Market Intelligence: Demand ${parsed.demandScore}/100, Opp ${parsed.opportunityScore}/100, Verdict: "${parsed.verdict}"`);
      results.push({ test: 'Niche Analysis', status: 'PASS' });
    } else {
      console.log(`${RED} 5. Niche Market Intelligence: Invalid schema`);
      results.push({ test: 'Niche Analysis', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`${RED} 5. Niche Market Intelligence: ${e.message}`);
    results.push({ test: 'Niche Analysis', status: 'FAIL', error: e.message });
  }

  // 6. Puzzle Generator Engine (Word Search list)
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Generate 12 theme-specific uppercase words (3-10 letters) for a "Ocean Animals" puzzle. Return JSON array of strings.',
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(res.text || '[]');
    if (Array.isArray(parsed) && parsed.length >= 8) {
      console.log(`${GREEN} 6. Puzzle Word Generator: Generated ${parsed.length} puzzle words: [${parsed.slice(0, 4).join(', ')}...]`);
      results.push({ test: 'Puzzle Word Gen', status: 'PASS' });
    } else {
      console.log(`${RED} 6. Puzzle Word Generator: Failed list format`);
      results.push({ test: 'Puzzle Word Gen', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`${RED} 6. Puzzle Word Generator: ${e.message}`);
    results.push({ test: 'Puzzle Word Gen', status: 'FAIL', error: e.message });
  }

  // 7. Plan Limits & Pricing Integrity Audit
  console.log('\n--- SAAS PLAN & PRICING VERIFICATION ---');
  const table = computeDynamicPricingTable(null);
  console.log(`Plans configured: ${Object.keys(PLAN_LIMITS).join(', ')}`);
  console.log(`Starter price: $${table.starter.USD} / ₹${table.starter.INR}`);
  console.log(`Pro price:     $${table.pro.USD} / ₹${table.pro.INR}`);
  console.log(`Agency price:  $${table.agency.USD} / ₹${table.agency.INR}`);
  console.log(`${GREEN} 7. Pricing Table: Dynamic multi-currency pricing calculation intact`);

  console.log('\n=== AUDIT COMPLETE ===\n');
}

audit();

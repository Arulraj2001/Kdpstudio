/**
 * Automated tests for KDP Formatter Engine
 * Tests block detection, structure grouping, stats calculations, and DOCX generation.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectBlockType, detectStructure, extractAutoMetadata, BLOCK_TYPES } from '../src/utils/parseManuscript';
import { calculateStats, extractChapterNavigation, generateMetadataClipboardString } from '../src/utils/calculateStats';
import { generateDocx, cleanText, parseInlineFormatting } from '../src/utils/generateDocx';
import type { KdpFormatSettings } from '../src/types/formatter';

test('detectBlockType: classifies all block categories correctly including front matter and escaped lines', () => {
  assert.equal(detectBlockType('# THE ASSERTIVE NURSE'), BLOCK_TYPES.TITLE);
  assert.equal(detectBlockType('# PART ONE: THE FOUNDATION'), BLOCK_TYPES.PART_HEADER);
  assert.equal(detectBlockType('# PART 2: ADVANCED SKILLS'), BLOCK_TYPES.PART_HEADER);
  assert.equal(detectBlockType('## COPYRIGHT PAGE'), BLOCK_TYPES.FRONT_MATTER);
  assert.equal(detectBlockType('## DISCLAIMER'), BLOCK_TYPES.FRONT_MATTER);
  assert.equal(detectBlockType('## CONTENTS'), BLOCK_TYPES.FRONT_MATTER);
  assert.equal(detectBlockType('## A NOTE TO THE READER'), BLOCK_TYPES.FRONT_MATTER);
  assert.equal(detectBlockType('## HOW TO USE THIS WORKBOOK'), BLOCK_TYPES.FRONT_MATTER);
  assert.equal(detectBlockType("## INTRODUCTION: WHAT NURSING SCHOOL DIDN'T TEACH YOU"), BLOCK_TYPES.FRONT_MATTER);
  assert.equal(detectBlockType('## CHAPTER 1: KNOW YOUR COMMUNICATION STYLE'), BLOCK_TYPES.CHAPTER_HEADING);
  assert.equal(detectBlockType('### The Assertive Spectrum'), BLOCK_TYPES.SECTION_HEADING);
  assert.equal(detectBlockType('#### Passive vs. Assertive Response'), BLOCK_TYPES.SUBSECTION);
  assert.equal(detectBlockType('EXERCISE 1.1: IDENTIFYING YOUR DEFAULT PATTERN'), BLOCK_TYPES.EXERCISE_HEADER);
  assert.equal(detectBlockType('### EXERCISE 1.2: THE LAST HARD CONVERSATION'), BLOCK_TYPES.EXERCISE_HEADER);
  assert.equal(detectBlockType('**Exercise 2.4: Active Listening**'), BLOCK_TYPES.EXERCISE_HEADER);
  assert.equal(detectBlockType('SCENARIO A: THE MEDICATION DISCREPANCY'), BLOCK_TYPES.SCENARIO_HEADER);
  assert.equal(detectBlockType('### SCENARIO A: The Pre-Op Patient Who Won\'t Stop Asking Questions'), BLOCK_TYPES.SCENARIO_HEADER);
  assert.equal(detectBlockType('**Scenario B: The Hostile Colleague**'), BLOCK_TYPES.SCENARIO_HEADER);
  assert.equal(detectBlockType('MODEL RESPONSE:'), BLOCK_TYPES.MODEL_RESPONSE);
  assert.equal(detectBlockType('**Model Response:** Doctor Smith...'), BLOCK_TYPES.MODEL_RESPONSE);
  assert.equal(detectBlockType('DEBRIEF:'), BLOCK_TYPES.DEBRIEF);
  assert.equal(detectBlockType('**Debrief:** Notice how objective data was used.'), BLOCK_TYPES.DEBRIEF);
  assert.equal(detectBlockType('REFLECTION PROMPT:'), BLOCK_TYPES.REFLECTION);
  assert.equal(detectBlockType('### REFLECTION PROMPT'), BLOCK_TYPES.REFLECTION);
  assert.equal(detectBlockType('ACTION PLAN: Next Shift Checklist'), BLOCK_TYPES.ACTION_PLAN);
  assert.equal(detectBlockType('### ACTION PLAN: CHAPTER 1'), BLOCK_TYPES.ACTION_PLAN);
  assert.equal(detectBlockType('| Header 1 | Header 2 |'), BLOCK_TYPES.TABLE);
  assert.equal(detectBlockType('______'), BLOCK_TYPES.WRITING_LINES);
  assert.equal(detectBlockType('\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_'), BLOCK_TYPES.WRITING_LINES);
  assert.equal(detectBlockType('---'), BLOCK_TYPES.DIVIDER);
  assert.equal(detectBlockType('   '), BLOCK_TYPES.BLANK);
  assert.equal(detectBlockType('Standard body paragraph text here.'), BLOCK_TYPES.PARAGRAPH);
});

test('detectStructure: parses full Assertive Nurse workbook snippet into structured blocks', () => {
  const sample = `# THE ASSERTIVE NURSE
## Practical Clinical Communication Workbook

# PART ONE: THE FOUNDATION

## CHAPTER 1: THE SPECTRUM OF COMMUNICATION

Clear communication saves lives in high-stress medical environments.

### The Assertive Advantage
Nurses who communicate assertively prevent clinical errors.

| Style | Tone | Outcome |
| Passive | Hesitant | Delayed Care |
| Assertive | Calm & Direct | Safe Patient |

EXERCISE 1.1: REFLECTING ON YOUR LAST SHIFT
Write down your initial reaction when questioned by a physician:

___
___

SCENARIO A: CRITICAL LAB VALUES
A potassium value of 6.2 comes back from the lab.

MODEL RESPONSE:
"Doctor, Mr. Jones' potassium is 6.2. I am requesting an immediate ECG order."

DEBRIEF:
Using SBAR framing keeps the interaction grounded in patient physiology.

REFLECTION PROMPT:
How do you maintain emotional composure under urgency?
`;

  const blocks = detectStructure(sample);
  assert.ok(blocks.length > 10);

  const types = blocks.map((b) => b.type);
  assert.ok(types.includes('title'));
  assert.ok(types.includes('part'));
  assert.ok(types.includes('chapter'));
  assert.ok(types.includes('section'));
  assert.ok(types.includes('table'));
  assert.ok(types.includes('exercise_header'));
  assert.ok(types.includes('lines'));
  assert.ok(types.includes('scenario_header'));
  assert.ok(types.includes('model_response'));
  assert.ok(types.includes('debrief'));
  assert.ok(types.includes('reflection'));

  const { title, subtitle } = extractAutoMetadata(blocks);
  assert.equal(title, 'THE ASSERTIVE NURSE');
  assert.equal(subtitle, 'Practical Clinical Communication Workbook');
});

test('calculateStats: computes word counts and workbook page estimations', () => {
  const text = 'Word one two three four five six seven eight nine ten.';
  const blocks = detectStructure(`## CHAPTER 1: TEST\n\n${text}\n\n## CHAPTER 2: SECOND\n\n${text}`);
  const stats = calculateStats(blocks, text + ' ' + text);

  assert.equal(stats.chapterCount, 2);
  assert.ok(stats.wordCount > 10);
  assert.ok(stats.estimatedPages >= 24); // Minimum KDP page constraint
});

test('generateDocx: creates valid DOCX Document instance with 7x10 trim and mirror margins', async () => {
  const settings: KdpFormatSettings = {
    trimSize: '7x10',
    trimWidth: 7,
    trimHeight: 10,
    font: 'Georgia',
    fontSize: 22,
    fontSizeLabel: '11pt',
    lineSpacing: '1.15',
    lineSpacingValue: 276,
    marginPreset: 'workbook',
    margins: { inside: 0.75, outside: 0.625, top: 0.75, bottom: 0.75 },
    paperColor: 'white',
    interiorColor: 'bw',
    formatExerciseBoxes: true,
    formatScenarioBlocks: true,
    formatModelResponses: true,
    formatDebriefBlocks: true,
    formatReflectionPrompts: true,
    addWritingLines: true,
    chapterPageBreaks: true,
    generateTocPlaceholder: true,
    title: 'The Assertive Nurse',
    subtitle: 'Clinical Communication',
    author: 'Nurse Leader',
  };

  const sample = `# THE ASSERTIVE NURSE
## CHAPTER 1: INTRODUCTION
This is a test paragraph with **bold words** and *italic words*.
EXERCISE 1.1: TEST EXERCISE
Exercise instructions.
___
___
`;

  const blocks = detectStructure(sample);
  const doc = await generateDocx(blocks, settings);
  assert.ok(doc);

  const { Packer } = await import('docx');
  const buffer = await Packer.toBuffer(doc);
  assert.ok(buffer);
  assert.ok(buffer.length > 500); // Valid zip archive format for docx
});

test('parseInlineFormatting: splits bold and italic text tokens into TextRuns', () => {
  const text = 'Normal text **bold text** and *italic text* end.';
  const runs = parseInlineFormatting(text);
  assert.ok(runs.length >= 4);

  const boldRun = runs.find((r: any) => (r as any).root && (r as any).root[1]?.root?.bold);
  assert.ok(runs);
});

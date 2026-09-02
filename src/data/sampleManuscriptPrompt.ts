/**
 * Universal Publication-Grade Non-Fiction Workbook AI Master Prompt & Sample Markdown Template
 * Engineered specifically for KDP Studio Interior Formatter & Amazon KDP Self-Publishing Suite.
 */

export const MASTER_AI_MANUSCRIPT_PROMPT = `You are a world-class Amazon KDP Master Publisher, bestselling Non-Fiction Author, and Instructional Designer. 

Your mission is to guide me through creating a publication-grade, high-converting Non-Fiction / Interactive Workbook manuscript in 100% KDP Studio-compatible Markdown, followed immediately by a complete Amazon KDP Publishing Metadata & Launch Kit.

---

### STEP 1: THE INTERACTIVE INTAKE (DO THIS FIRST)
Before generating the book, please ask me the following 6 quick questions and wait for my response:

1. **Book Topic / Niche:** What specific topic or problem does this book address? (e.g., "Somatic Anxiety Recovery", "Commercial Real Estate Negotiation", "Parenting Strong-Willed Toddlers", "B2B SaaS Sales")
2. **Target Reader:** Who is this book written for? (e.g., "Beginners feeling overwhelmed", "Mid-career professionals", "First-time buyers")
3. **Core Transformation / Framework:** Is there a specific methodology, framework name, or 3–5 step process you want featured? (Or should I invent a memorable proprietary framework for you?)
4. **Author Name & Bio:** What author/pen name and credentials should be used on the title and copyright page?
5. **Tone & Style:** What voice do you prefer? (e.g., "Warm & Empathetic", "Direct & Tactical", "Clinical & Authoritative", "Inspiring & Action-Oriented")
6. **Book Scope:** Standard full workbook (4–5 Parts, 12–14 Chapters) or compact edition (3 Parts, 8–10 Chapters)?

*(Once I reply with my answers, you will generate STEP 2 and STEP 3 in full).*

---

### STEP 2: THE COMPLETE MARKDOWN MANUSCRIPT
Generate the entire book manuscript in pure Markdown format strictly following the structural syntax required by KDP Studio Interior Formatter:

1. **Title & Front Matter:**
   - \`# [BOOK TITLE IN ALL CAPS]\`
   - \`## [Subtitle: Clear Benefit-Driven Statement for Target Reader]\`
   - Separators with \`---\` between Title, Author Name, Publisher & Year.
   - \`## COPYRIGHT PAGE\` (with copyright notice, all rights reserved, ISBN placeholder, and edition info).
   - \`## DISCLAIMER\` (tailored to the niche: educational/professional development).

2. **Table of Contents (Auto-Detected Container):**
   - \`## CONTENTS\`
   - Clean sequential list of Front Matter, Parts (e.g., \`PART ONE: ...\`), Chapters (e.g., \`Chapter 1: ...\`), and Appendices.

3. **Front Matter Core Sections:**
   - \`## A NOTE TO THE READER\` (2–3 warm, personal paragraphs connecting with reader frustration).
   - \`## HOW TO USE THIS WORKBOOK\` (Guidance on writing in book, model responses, and practice).
   - \`## INTRODUCTION: [HOOK TITLE]\` (The documented problem, the research gap, what this book does and does NOT do).

4. **Parts & Chapters Architecture:**
   - \`# PART ONE: [PART NAME]\` (Part divider pages with title).
   - \`## CHAPTER [X]: [CHAPTER TITLE]\` (Clear learning objective, 3 detailed sections with deep insights).
   - \`### [Section Title]\` (Practical explanations, frameworks, real-world examples).

5. **Interactive Workbook Blocks (Auto-Styled into Boxes & Lines by Formatter):**
   - **Exercises:** Start with \`EXERCISE X.Y: [NAME IN ALL CAPS]\` followed by instructions.
   - **Fill-in Writing Lines:** Use triple underscores separated by newlines:
     \`\`\`
     ___
     ___
     ___
     \`\`\`
   - **Structured Markdown Tables:** Comparison matrices, diagnostic checklists, and self-assessments:
     \`\`\`
     | Trigger Scenario | Instinctive Default | Calibrated Strategy |
     |------------------|---------------------|---------------------|
     \`\`\`
   - **Real-World Scenarios:** Use \`SCENARIO A: [SITUATION TITLE]\` with exact bold headers:
     - \`**The situation:** [Realistic 3-4 sentence case context]\`
     - \`**What makes this difficult:** [Key tensions and risks]\`
     - \`**What you need to accomplish:** [Specific goal]\`
     - \`**Your response — write before reading the model:**\` followed by writing lines \`___\`.
   - **Model Responses:** \`MODEL RESPONSE:\` with natural dialogue and narrative breakdown.
   - **Debriefs:** \`DEBRIEF:\` with bulleted analysis of why the model worked, principles, and common pitfalls.
   - **Reflection Prompts:** \`REFLECTION PROMPT\` followed by a deep introspection question and writing lines.
   - **Chapter Action Plans:** \`ACTION PLAN: CHAPTER [X]\` with explicit weekly commitment prompts.

6. **Appendices & Back Matter:**
   - \`# APPENDIX A: [FRAMEWORK] QUICK-REFERENCE CARD\` (Pocket summary and reset phrases).
   - \`# APPENDIX B: SCRIPTS & OPENING LINES FOR HIGH-FREQUENCY SITUATIONS\` (10–15 exact conversational phrases).
   - \`# APPENDIX C: PRE-CONVERSATION PREPARATION WORKSHEET\` (Fillable planning sheet).
   - \`# APPENDIX D: RECOMMENDED RESOURCES & FURTHER READING\`
   - \`## ABOUT THE AUTHOR\`

---

### STEP 3: AMAZON KDP LAUNCH & METADATA PACKAGE (IN THE SAME CHAT)
Immediately following the Markdown manuscript, output the complete Amazon KDP backend publishing kit so I can publish without leaving:

1. **Amazon KDP Optimized Title & Subtitle:**
   - Primary Title (Max 200 characters)
   - Search-Optimized Subtitle containing top user pain points.

2. **Amazon HTML Book Description (Copy & Paste Ready for KDP Backend):**
   - High-converting sales copy formatted with valid Amazon HTML tags: \`<h2>\`, \`<b>\`, \`<i>\`, \`<ul>\`, \`<li>\`.
   - Includes: Hook headline, relatable problem, bulleted list of benefits/skills learned, inside look at exercises, social proof/transformation promise, and bold Call to Action.

3. **7 Amazon Backend Search Keywords (Under 50 Characters Each):**
   - 7 distinct, non-repetitive long-tail search phrases based on high commercial buyer intent.
   - Brief explanation of keyword strategy for each.

4. **2 Recommended Amazon / BISAC Browse Categories:**
   - Exact category path (e.g., *Self-Help > Communication & Social Skills* or *Business & Money > Management & Leadership*).

5. **Pricing & Royalty Strategy:**
   - Recommended Kindle eBook Price (e.g., $4.99 – $9.99 for 70% royalty).
   - Recommended Paperback Price based on estimated page count and Amazon print cost calculations.

6. **A+ Content Blueprint:**
   - 3 Feature Highlight Modules with headlines, body copy, and suggested image themes for the Amazon product detail page.

---

Let's begin! Please ask me the 6 initial intake questions now so we can craft the perfect book.`;

export const SAMPLE_MANUSCRIPT_MD = `# [BOOK TITLE IN ALL CAPS]
## [Subtitle: Clear Benefit-Driven Statement for Target Reader]

---

[Author Name]
[Credentials / Affiliation]

---

[Publisher Name / Independently Published]
[Year]

---

## COPYRIGHT PAGE

Copyright © [Year] by [Author Name]

All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.

Published in the United States of America

ISBN: [To be assigned]

First edition

For permissions requests, bulk purchasing, or corporate licensing inquiries, contact: [Author contact email]

---

## DISCLAIMER

This book is intended for educational, instructional, and personal/professional development purposes only. It does not constitute formal medical, clinical, psychological, legal, or financial advice, and should not be used as a substitute for individualized professional judgment or institutional regulations.

The author and publisher disclaim any liability or responsibility for outcomes resulting directly or indirectly from the application of techniques described in this workbook. Always apply your own sound judgment and follow applicable standards in your field.

---

## CONTENTS

A Note to the Reader
How to Use This Workbook
Introduction: [The Core Challenge & Promise]

PART ONE: THE FOUNDATION
Chapter 1: [Self-Awareness & Identifying Your Patterns]
Chapter 2: [The Core Framework & Methodology]
Chapter 3: [Managing Internal Resistance & High-Pressure Moments]

PART TWO: CORE SITUATION TYPES
Chapter 4: [Navigating Difficult Interaction Type A]
Chapter 5: [Navigating Difficult Interaction Type B]
Chapter 6: [Navigating Difficult Interaction Type C]
Chapter 7: [Setting and Holding Non-Negotiable Boundaries]

PART THREE: COMPLEX DYNAMICS & ESCALATIONS
Chapter 8: [Managing High-Stakes Demands & Distrust]
Chapter 9: [Delivering Hard Decisions with Clarity]

PART FOUR: TEAM & PROFESSIONAL ALIGNMENT
Chapter 10: [Communicating Upward to Decision Makers]
Chapter 11: [Resolving Conflict and Peer Friction]

PART FIVE: SUSTAINABILITY & LONG-TERM MASTERY
Chapter 12: [Maintenance, Recovery, and Preventing Burnout]

Appendix A: Quick-Reference Framework Card
Appendix B: High-Frequency Scripts & Opening Lines
Appendix C: Pre-Conversation Preparation Worksheet
Appendix D: Recommended Resources & Further Reading
About the Author

---

## A NOTE TO THE READER

If you have picked up this workbook, you are likely facing situations where standard advice has proven inadequate. You know the frustration of having clear intentions only to watch conversations stall, escalate, or leave key issues unaddressed.

Most resources either offer superficial platitudes or dry academic theory that vanishes the second pressure rises. 

This workbook was written to bridge that gap. It provides tactical, structured, and repeatable frameworks designed to work when emotions are charged and stakes are high. You will not find generic corporate scripts here; instead, you will build genuine conversational resilience tailored to your real-world environment.

---

## HOW TO USE THIS WORKBOOK

To maximize your results from this guide:

- **Sequential Study vs. Field Reference:** Complete Part One first to master the core foundation. Thereafter, use individual chapters as on-demand prep before challenging meetings.
- **Write Actively in the Book:** The exercises and writing lines are not optional extras — writing clarifies thought and cements muscle memory under pressure.
- **Model Responses as Guides, Not Scripts:** Use the dialogue examples to observe principles in action, then adapt the wording into your authentic personal voice.
- **Commit to the Action Plans:** Consistent small adjustments in your daily interactions will produce profound long-term transformation.

---

## INTRODUCTION: [HOOK TITLE — THE UNADDRESSED GAP]

Most professional education and training programs focus heavily on technical expertise while assuming interpersonal communication will develop through intuition. 

Yet industry research consistently confirms that over 70% of professional breakdowns and project failures stem from conversational friction rather than technical inadequacy.

When stakes rise, human biology instinctively defaults to primitive fight, flight, or appease responses. True mastery is the deliberate discipline of centering yourself, validating core concerns, and steering conversations toward mutually aligned outcomes.

---

# PART ONE: THE FOUNDATION

---

## CHAPTER 1: [TITLE — SELF-AWARENESS & PATTERNS UNDER STRESS]

By the end of this chapter, you will be able to recognize your primary physiological stress triggers and deploy a calibrated three-second reset before responding.

### Section 1: The Reality of High-Pressure Moments

In critical moments, human communication rarely follows idealized textbook scripts. Defensiveness, fatigue, and competing priorities create emotional static. 

Effective communicators do not attempt to suppress this tension; they learn to navigate it with calm authority.

### Section 2: Identifying the Three Default Reactions

Under acute stress, professionals typically default to one of three patterns:
1. **The Appeaser:** Yields boundaries quickly to avoid confrontation, creating future ambiguity.
2. **The Defender:** Counters emotional tension with rigid policy and justifications, fueling escalation.
3. **The Withdrawer:** Shuts down and offers minimal compliance, leaving core issues unresolved.

### Section 3: Establishing the Intentional Reset

Before speaking in tense moments, top performers execute a deliberate physical and cognitive pause: lowering vocal pitch, relaxing shoulder tension, and focusing on the single primary outcome needed.

---

EXERCISE 1.1: PERSONAL INTERACTION AUDIT

Reflect on your most challenging interaction over the past month and complete the diagnostic prompts below:

Describe the exact moment the discussion shifted from productive to tense:

___
___
___

What physical cues did you experience (e.g., tight chest, clenched jaw, elevated heart rate)?

___
___
___

Did your instinctive response lean toward appeasing, defending, or withdrawing?

___
___
___

---

EXERCISE 1.2: INTERACTION PATTERNS MATRIX

| Trigger Scenario | Instinctive Default | Calibrated Alternative |
|------------------|---------------------|------------------------|
| Unreasonable urgent demand | Immediate defensiveness | "Let's review priorities together right now." |
| Aggressive or emotional criticism | Over-explaining justifications | "I hear your concern. Let's focus on the resolution." |
| Unclear or passive resistance | Frustrated avoidance | "Help me understand what's standing in the way." |
| Sudden timeline acceleration | Panic and compliance | "Here are the trade-offs required to meet that date." |

---

REFLECTION PROMPT

When you feel unfairly criticized or pressured, what core belief gets triggered, and how does that belief influence your tone and word choice?

___
___
___
___

---

ACTION PLAN: CHAPTER 1

Identify your primary physical warning sign. Commit to using it as a cue to take one steady breath and pause for two seconds before responding during your upcoming week.

My commitment: ___
___
___

---

## CHAPTER 2: [TITLE — THE CORE OPERATIONAL METHOD]

This chapter introduces the central framework applied across all subsequent scenario chapters.

### The 5-Step Methodology

**1. Center & Calm:** Regulate your own physiology before speaking. Lower your vocal cadence.

**2. Listen Actively:** Extract the emotional core and factual priorities beneath agitation.

**3. Empathize & Validate:** Acknowledge distress without accepting inaccurate blame.

**4. Articulate Options:** Present structured, viable choices with clear rationale.

**5. Resolve with Agreement:** Confirm mutual understanding, timeline, and next steps.

### Framework at a Glance

| Step | Core Question to Ask Yourself | Objective Action |
|------|-------------------------------|------------------|
| 1. Center | "Am I composed and in control of my tone?" | Relax posture, lower pitch, plant feet |
| 2. Listen | "What underlying need is driving this?" | Summarize without interrupting |
| 3. Empathize | "How can I validate their concern?" | Acknowledge tension without blame |
| 4. Articulate | "What are the viable next steps?" | Offer structured A/B choices |
| 5. Resolve | "What have we explicitly agreed upon?" | Establish timeline and accountability |

---

EXERCISE 2.1: FRAMEWORK PRACTICE SCENARIO

**Scenario:** A critical stakeholder is frustrated regarding an unexpected delay.

**Step 1 (Center):** Draft your self-regulation reminder:

___
___

**Step 2 (Listen):** What is their primary operational fear?

___
___

**Step 3 (Empathize):** Write your validating opening statement:

___
___

**Step 4 (Articulate):** What two concrete options will you present?

___
___

**Step 5 (Resolve):** How will you confirm mutual alignment?

___
___

---

ACTION PLAN: CHAPTER 2

Review the Quick-Reference Card in Appendix A before your next critical meeting.

---

# PART TWO: CORE SITUATION TYPES

---

## CHAPTER 4: [TITLE — HANDLING HIGH-TENSION CONFLICT]

By the end of this chapter, you will be able to de-escalate aggressive confrontations while holding firm professional boundaries.

---

SCENARIO A: THE AGGRESSIVE CONFRONTATION

**The situation:** A key counterpart confronts you aggressively in front of colleagues, accusing your team of negligence regarding an overdue deliverable.

**What makes this difficult:** You are being publicly confronted, adrenaline is surging, and defensive counter-attacks will escalate the hostility.

**What you need to accomplish:** Lower the room's emotional temperature, protect your professional boundaries, and redirect into fact-based problem solving.

**Your response — write before reading the model:**

___
___
___
___
___
___

---

MODEL RESPONSE:

"I understand how critical this deliverable is to the project timeline, and I hear your urgency. 

However, we will not resolve this effectively while voices are raised. 

Let's pull up the project log right now so we can look at the data together and agree on the fastest path to completion."

---

DEBRIEF:

Key principles demonstrated in this model:
- **Validated Urgency Immediately:** Disarmed the emotional charge within the first ten words.
- **Held Firm Dignity Boundary:** Stated non-negotiable expectations calmly without returning insult.
- **Reframed into Joint Action:** "Let's look at the data together" shifted the dynamic from adversarial to collaborative.

---

EXERCISE 4.1: DE-ESCALATION RESPONSES TABLE

| Confrontational Statement | Avoid Saying | Calibrated De-Escalation |
|---------------------------|--------------|--------------------------|
| "This is completely unacceptable!" | "Calm down, it's not my fault." | "I understand your frustration. Let's fix this immediately." |
| "You never follow through!" | "That is completely untrue." | "Let's review our agreed commitments and close any gaps." |
| "I want this done right now!" | "You'll have to wait your turn." | "Here is the realistic timeline to complete this accurately." |

---

REFLECTION PROMPT

What makes holding boundaries difficult for you when someone is emotionally escalated?

___
___
___
___

---

ACTION PLAN: CHAPTER 4

Practice using a calm, lowered vocal pitch whenever someone raises their voice with you this week.

---

# APPENDIX A: QUICK-REFERENCE FRAMEWORK CARD

## 5-STEP CORE METHOD SUMMARY

**1. Center:** Lower pitch by 10%, breathe steadily, plant feet.
**2. Listen:** Identify the real unmet need beneath the words.
**3. Empathize:** Validate their concern without accepting false blame.
**4. Articulate:** Give clear, structured options.
**5. Resolve:** Confirm the exact next step and owner.

---

**Emergency Reset Phrase:**
"We both want a successful outcome here. Let's pause and focus on the immediate step in front of us."

---

# APPENDIX B: HIGH-FREQUENCY SCRIPTS & OPENING LINES

**1. When interrupted repeatedly:**
"Please allow me to finish this thought so you have the full context, and then I will gladly answer your question."

**2. When an unreasonable deadline is imposed:**
"To meet that timeline without compromising quality, we will need to adjust Scope Item B. Which should we prioritize?"

**3. When managing an aggressive critique:**
"I hear your concern. Let's focus on the specific changes required to get this aligned."

---

# APPENDIX C: PRE-CONVERSATION PREPARATION WORKSHEET

**Who am I speaking with:** ___

**What is the core issue:** ___

**What is my ideal outcome:** ___

**What is my boundary:** ___

---

**Step-by-Step Preparation:**

**1. Anticipated emotion from them:** ___

**2. My validating opening sentence:**

___
___

**3. The single most essential fact I must communicate:**

___
___

**4. The specific next step to confirm:**

___
___

---

## ABOUT THE AUTHOR

**[Author Name]** is an author, strategist, and executive consultant with extensive experience guiding individuals and organizations through high-stakes transitions. 

Their work focuses on delivering practical, evidence-based frameworks that build resilience and produce measurable results.

For additional workbooks, digital resources, and corporate training programs, visit **[Author Website]**.
`;

/**
 * Story Beat Framework Templates for KDP Studio Book Studio
 * Provides industry-standard novel plotting frameworks for fiction and non-fiction authors
 */

export interface BeatItem {
  id: string;
  name: string;
  description: string;
  percentageIn: number; // Approximate position in manuscript as %
  chapterHint: string;  // Suggested chapter name
  prompt: string;       // AI writing prompt for this beat
}

export interface StoryFramework {
  id: string;
  name: string;
  shortName: string;
  genre: string;
  description: string;
  totalBeats: number;
  beats: BeatItem[];
  creditedTo: string;
}

// ─────────────────────────────────────────────────────────────
// 1. Save the Cat! — Blake Snyder (15 Beats)
// ─────────────────────────────────────────────────────────────
export const SAVE_THE_CAT: StoryFramework = {
  id: 'save-the-cat',
  name: 'Save the Cat! (15 Beats)',
  shortName: 'Save the Cat',
  genre: 'Fiction (Any)',
  description: 'Blake Snyder\'s genre-fluid 15-beat plot structure — the most widely used beat sheet in Hollywood and commercial fiction.',
  creditedTo: 'Blake Snyder',
  totalBeats: 15,
  beats: [
    { id: 'stc-1', name: 'Opening Image', percentageIn: 1, chapterHint: 'Prologue / Opening Scene', description: 'A snapshot of the hero\'s imperfect world before the story begins.', prompt: 'Write a vivid opening scene that establishes your protagonist\'s ordinary world, their greatest flaw, and a visual symbol that will bookend the story.' },
    { id: 'stc-2', name: 'Theme Stated', percentageIn: 5, chapterHint: 'Chapter 1', description: 'Someone hints (unwittingly) at what the story is really about.', prompt: 'Write a scene where a character casually states the thematic message of the entire story, without the protagonist yet understanding it.' },
    { id: 'stc-3', name: 'Set-Up', percentageIn: 10, chapterHint: 'Chapter 1-2', description: 'Establish the protagonist, their world, what they WANT and what they NEED.', prompt: 'Introduce your protagonist in their stasis world. Show their daily routine, key relationships, their deep flaw, and what they\'re missing in life.' },
    { id: 'stc-4', name: 'Catalyst', percentageIn: 12, chapterHint: 'Chapter 2', description: 'The inciting incident that disrupts the status quo and forces the story forward.', prompt: 'Write a catalytic event that drops onto your protagonist\'s doorstep, disrupting their world and making it impossible to continue as before.' },
    { id: 'stc-5', name: 'Debate', percentageIn: 17, chapterHint: 'Chapter 2-3', description: 'The protagonist debates whether to cross into Act Two. They resist change.', prompt: 'Write your protagonist\'s internal conflict as they debate whether to take the leap. Show their fear, their hesitation, and what the choice will cost them.' },
    { id: 'stc-6', name: 'Break into Two', percentageIn: 25, chapterHint: 'Chapter 4', description: 'The protagonist makes a choice and enters the upside-down world of Act Two.', prompt: 'Your protagonist makes a proactive choice that launches them into the new world of Act Two. There is no going back from this decision.' },
    { id: 'stc-7', name: 'B Story', percentageIn: 30, chapterHint: 'Chapter 4-5', description: 'A new character (love interest, mentor, rival) enters and carries the theme.', prompt: 'Introduce the B-Story character — often a love interest or mentor — who will challenge your protagonist and carry the thematic message of transformation.' },
    { id: 'stc-8', name: 'Fun and Games', percentageIn: 30, chapterHint: 'Chapters 4-8', description: 'The promise of the premise: the exciting, entertaining exploration of the new world.', prompt: 'Write the most entertaining sequence of your book — your protagonist exploring, struggling, growing, and experiencing the full flavor of the new world. This is your book\'s "hook" content.' },
    { id: 'stc-9', name: 'Midpoint', percentageIn: 50, chapterHint: 'Chapter 8-9', description: 'A false victory or false defeat that raises the stakes sky-high.', prompt: 'At the exact middle of your story, write a moment where your protagonist either achieves a false victory (things seem won, but aren\'t) or suffers a false defeat. Stakes escalate dramatically.' },
    { id: 'stc-10', name: 'Bad Guys Close In', percentageIn: 55, chapterHint: 'Chapters 9-11', description: 'The antagonistic forces regroup and attack the protagonist\'s progress.', prompt: 'Write the sequence where external villains, internal flaws, and relational conflicts converge to systematically dismantle everything your protagonist has achieved since Act Two.' },
    { id: 'stc-11', name: 'All Is Lost', percentageIn: 75, chapterHint: 'Chapter 11-12', description: 'The lowest point. A "whiff of death" — something is lost forever.', prompt: 'Write the lowest moment of the story. Your protagonist loses something precious — a relationship, a belief, a dream. This is darker than any previous setback.' },
    { id: 'stc-12', name: 'Dark Night of the Soul', percentageIn: 78, chapterHint: 'Chapter 12', description: 'The protagonist sits in the ashes and contemplates how they got here.', prompt: 'Your protagonist is alone, broken, and without hope. Write their darkest internal moment of reflection and despair before the new idea that will save everything arrives.' },
    { id: 'stc-13', name: 'Break into Three', percentageIn: 80, chapterHint: 'Chapter 13', description: 'A new idea (from the B Story) gives the protagonist what they need to win.', prompt: 'Write the turning point where your protagonist synthesizes what they\'ve learned from the B-Story character and devises a new plan to solve their problem — using the theme.' },
    { id: 'stc-14', name: 'Finale', percentageIn: 85, chapterHint: 'Chapters 13-15', description: 'The protagonist executes their new plan, defeats the villain, and proves their transformation.', prompt: 'Write the climactic sequence where your protagonist demonstrates true change by defeating the antagonist using their newly acquired skill, belief, or relationship. The old world order is transformed.' },
    { id: 'stc-15', name: 'Final Image', percentageIn: 99, chapterHint: 'Epilogue / Final Scene', description: 'The mirror to the Opening Image — proof that the hero has changed.', prompt: 'Write a final image or scene that directly mirrors your opening, but proves that your protagonist and their world have fundamentally transformed. The thematic question is answered.' },
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. Hero's Journey — Joseph Campbell (12 Stages)
// ─────────────────────────────────────────────────────────────
export const HEROS_JOURNEY: StoryFramework = {
  id: 'heros-journey',
  name: "Hero's Journey (12 Stages)",
  shortName: "Hero's Journey",
  genre: 'Fantasy, Adventure, Epic Fiction',
  description: "Joseph Campbell's mythic narrative cycle — the foundation of Star Wars, Lord of the Rings, Harry Potter and virtually every quest-based novel.",
  creditedTo: 'Joseph Campbell',
  totalBeats: 12,
  beats: [
    { id: 'hj-1', name: 'Ordinary World', percentageIn: 1, chapterHint: 'Chapter 1', description: 'The hero\'s normal life before the adventure begins.', prompt: 'Establish your hero\'s ordinary world — their home, community, relationships, and the comfortable life they must eventually leave behind.' },
    { id: 'hj-2', name: 'Call to Adventure', percentageIn: 10, chapterHint: 'Chapter 1-2', description: 'The hero receives a challenge or call that disrupts ordinary life.', prompt: 'Write the moment your hero receives the call to adventure — a message, a quest, an event that shatters the ordinary world and demands action.' },
    { id: 'hj-3', name: 'Refusal of the Call', percentageIn: 13, chapterHint: 'Chapter 2', description: 'The hero initially resists the call out of fear, duty, or insecurity.', prompt: 'Show your hero\'s initial refusal or hesitation — their fear of leaving the known world for the unknown.' },
    { id: 'hj-4', name: 'Meeting the Mentor', percentageIn: 18, chapterHint: 'Chapter 2-3', description: 'A wise figure gives the hero training, advice, or magical gifts.', prompt: 'Introduce the mentor character who provides your hero with guidance, tools, wisdom, or a crucial gift for the journey ahead.' },
    { id: 'hj-5', name: 'Crossing the Threshold', percentageIn: 25, chapterHint: 'Chapter 3-4', description: 'The hero commits to the adventure and crosses into the Special World.', prompt: 'Your hero crosses the point of no return — entering a new world of unknown rules, dangers, and wonders they\'ve never encountered before.' },
    { id: 'hj-6', name: 'Tests, Allies, Enemies', percentageIn: 35, chapterHint: 'Chapters 4-7', description: 'The hero faces challenges, makes allies and enemies in the new world.', prompt: 'Write a series of tests and trials that force the hero to learn the rules of the new world, form alliances, and confront early antagonists.' },
    { id: 'hj-7', name: 'Approach to the Inmost Cave', percentageIn: 50, chapterHint: 'Chapter 7-8', description: 'The hero prepares for the central ordeal — the edge of the most dangerous place.', prompt: 'Your hero approaches the dangerous heart of the special world. Write the preparation, the fear, and the final gathering of allies before the great ordeal.' },
    { id: 'hj-8', name: 'The Ordeal', percentageIn: 55, chapterHint: 'Chapter 8-9', description: 'The central crisis — the hero faces death or their greatest fear.', prompt: 'Write the supreme ordeal — a life-or-death confrontation that brings your hero to the very edge of destruction. They must die metaphorically to be reborn.' },
    { id: 'hj-9', name: 'Reward (Seizing the Sword)', percentageIn: 65, chapterHint: 'Chapter 9-10', description: 'The hero survives and claims the prize — a treasure, knowledge, or reconciliation.', prompt: 'Having survived the ordeal, your hero claims the reward — a magical object, forbidden knowledge, or deep insight that makes the entire journey worthwhile.' },
    { id: 'hj-10', name: 'The Road Back', percentageIn: 75, chapterHint: 'Chapter 10-11', description: 'The hero begins the return journey — often pursued by remaining antagonistic forces.', prompt: 'Your hero turns back toward the ordinary world, but the journey isn\'t over. Write the chase, consequence, or new danger that threatens the hero\'s return.' },
    { id: 'hj-11', name: 'Resurrection', percentageIn: 85, chapterHint: 'Chapter 12', description: 'The hero is tested one final time and is transformed by a supreme sacrifice.', prompt: 'Write the climactic final test where your hero is "reborn" — applying everything learned on the journey to defeat the final antagonist through genuine transformation.' },
    { id: 'hj-12', name: 'Return with the Elixir', percentageIn: 95, chapterHint: 'Chapter 13 / Epilogue', description: 'The hero returns home transformed, bringing a gift that benefits their world.', prompt: 'Your hero returns to the ordinary world forever changed, bearing a gift — wisdom, treasure, peace, or love — that heals and transforms the community they left behind.' },
  ],
};

// ─────────────────────────────────────────────────────────────
// 3. Classic 3-Act Structure
// ─────────────────────────────────────────────────────────────
export const THREE_ACT: StoryFramework = {
  id: 'three-act',
  name: 'Classic 3-Act Structure',
  shortName: '3-Act',
  genre: 'All Fiction',
  description: 'The foundational plot structure of Western storytelling — Setup, Confrontation, and Resolution. Works for all genres.',
  creditedTo: 'Aristotle (adapted)',
  totalBeats: 9,
  beats: [
    { id: '3a-1', name: 'Exposition', percentageIn: 1, chapterHint: 'Chapter 1', description: 'Establish the setting, protagonist, and status quo.', prompt: 'Open your story with a vivid establishment of the world, your protagonist, and the stakes of the narrative.' },
    { id: '3a-2', name: 'Inciting Incident', percentageIn: 10, chapterHint: 'Chapter 2', description: 'An event disrupts the protagonist\'s world and launches the story.', prompt: 'Write the inciting incident that permanently disrupts your protagonist\'s ordinary life and creates the central conflict.' },
    { id: '3a-3', name: 'Rising Action (Act 1)', percentageIn: 15, chapterHint: 'Chapter 2-3', description: 'The protagonist responds and commits to facing the conflict.', prompt: 'Your protagonist takes their first steps into the conflict, establishing their goal and the obstacles they must overcome.' },
    { id: '3a-4', name: 'Act 1 Break', percentageIn: 25, chapterHint: 'Chapter 3-4', description: 'The protagonist crosses into a new world or commits to a new plan.', prompt: 'Write the dramatic turn at the end of Act One where your protagonist\'s old life is definitively severed and a new path begins.' },
    { id: '3a-5', name: 'Rising Action (Act 2)', percentageIn: 35, chapterHint: 'Chapters 4-8', description: 'Escalating complications, reversals, and character revelations.', prompt: 'Write a series of escalating complications and reversals that force your protagonist to grow, adapt, and confront deeper truths about themselves and the antagonist.' },
    { id: '3a-6', name: 'Midpoint', percentageIn: 50, chapterHint: 'Chapter 7-8', description: 'A pivotal reversal or revelation resets the stakes.', prompt: 'At the midpoint, write a major reversal or revelation that reframes the conflict and raises the stakes to a new level.' },
    { id: '3a-7', name: 'Crisis / Dark Night', percentageIn: 75, chapterHint: 'Chapter 10-11', description: 'The protagonist hits their lowest point, seemingly defeated.', prompt: 'Write the darkest moment of the story — the protagonist faces catastrophic setback and must find a new source of strength to continue.' },
    { id: '3a-8', name: 'Act 2 Break / Climax Setup', percentageIn: 80, chapterHint: 'Chapter 11-12', description: 'The protagonist devises the final plan and commits to the climax.', prompt: 'Your protagonist gathers all resources, accepts the final risk, and commits to the climactic confrontation that will resolve the central conflict.' },
    { id: '3a-9', name: 'Resolution', percentageIn: 90, chapterHint: 'Chapter 12-14', description: 'The conflict is resolved and the new order is established.', prompt: 'Write the climax and its aftermath — the conflict resolved, the transformed world established, and the thematic message delivered through your protagonist\'s arc.' },
  ],
};

// ─────────────────────────────────────────────────────────────
// 4. Romance Beat Sheet
// ─────────────────────────────────────────────────────────────
export const ROMANCE_BEATS: StoryFramework = {
  id: 'romance-beats',
  name: 'Romance Beat Sheet',
  shortName: 'Romance',
  genre: 'Romance, Contemporary, RomCom',
  description: 'High-converting romance structure optimized for Amazon bestseller category listings and reader expectations.',
  creditedTo: 'Romance Writers of America (adapted)',
  totalBeats: 10,
  beats: [
    { id: 'rb-1', name: 'Meet the Hero/Heroine', percentageIn: 5, chapterHint: 'Chapter 1', description: 'Establish both protagonists independently — their wants, fears, and wounds.', prompt: 'Introduce your lead character(s) and establish their emotional wound that prevents them from opening their heart to love.' },
    { id: 'rb-2', name: 'The Meet Cute', percentageIn: 12, chapterHint: 'Chapter 1-2', description: 'The two romantic leads meet in an unexpected, memorable way.', prompt: 'Write the meet cute — the unforgettable first encounter between your romantic leads, charged with conflict, chemistry, or both.' },
    { id: 'rb-3', name: 'Instant Tension', percentageIn: 15, chapterHint: 'Chapter 2', description: 'There\'s an immediate reason these two shouldn\'t be together.', prompt: 'Establish the core conflict keeping your leads apart — social class, rivalry, misunderstanding, or external circumstance.' },
    { id: 'rb-4', name: 'Forced Proximity', percentageIn: 20, chapterHint: 'Chapter 3-4', description: 'Circumstances force them to spend time together despite the tension.', prompt: 'Write the setup that forces your romantic leads into close proximity — a shared project, a snowstorm, a job, a bet — despite their reasons to stay apart.' },
    { id: 'rb-5', name: 'First Spark', percentageIn: 30, chapterHint: 'Chapter 4-5', description: 'A genuine moment of connection, humor, or vulnerability cracks the walls.', prompt: 'Write the moment when the wall between your leads cracks — a shared laugh, an honest confession, an unexpected act of kindness that changes how they see each other.' },
    { id: 'rb-6', name: 'Midpoint Date / Moment', percentageIn: 50, chapterHint: 'Chapter 7-8', description: 'A romantic high point — perhaps a first kiss or emotional declaration.', prompt: 'Write the romantic peak of the first half — a date, a kiss, a vulnerable moment of emotional honesty that deepens the connection between your leads.' },
    { id: 'rb-7', name: 'The Complication', percentageIn: 60, chapterHint: 'Chapter 8-9', description: 'An external or internal force threatens to destroy the relationship.', prompt: 'Write the complication that threatens everything — a secret revealed, a misunderstanding, an external rival, or a character returning to old destructive patterns.' },
    { id: 'rb-8', name: 'The Breakup / Black Moment', percentageIn: 75, chapterHint: 'Chapter 10-11', description: 'The relationship shatters at its lowest point.', prompt: 'Write the dark moment when the romantic relationship implodes — the breakup, the betrayal, or the cruel words that seem to end all hope of love.' },
    { id: 'rb-9', name: 'Internal Growth', percentageIn: 80, chapterHint: 'Chapter 11-12', description: 'Each protagonist confronts their emotional wound and chooses to change.', prompt: 'Write the separate growth arcs — each character alone with their choice, confronting the emotional wound that created the conflict, and deciding to be better.' },
    { id: 'rb-10', name: 'Grand Gesture & HEA', percentageIn: 90, chapterHint: 'Chapter 12-14', description: 'One protagonist makes a grand gesture; the other accepts. Happily Ever After.', prompt: 'Write the grand gesture — a public declaration, a sacrifice, or a vulnerable act of love — and the joyful reconciliation that delivers the Happily Ever After (HEA) your readers demand.' },
  ],
};

// ─────────────────────────────────────────────────────────────
// 5. Non-Fiction Problem-Agitate-Solve
// ─────────────────────────────────────────────────────────────
export const NONFICTION_PAS: StoryFramework = {
  id: 'nonfiction-pas',
  name: 'Non-Fiction Blueprint (PAS Framework)',
  shortName: 'Non-Fiction',
  genre: 'Self-Help, Business, How-To',
  description: 'The Problem-Agitate-Solve structure used by bestselling non-fiction authors. Each chapter delivers actionable value and builds authority.',
  creditedTo: 'Dan Kennedy (adapted)',
  totalBeats: 9,
  beats: [
    { id: 'nf-1', name: 'Hook & Promise', percentageIn: 1, chapterHint: 'Introduction', description: 'State the bold promise of your book and establish credibility.', prompt: 'Open with a bold promise to your reader — what specific transformation will they experience by the last page? Establish your credibility and the stakes of not reading on.' },
    { id: 'nf-2', name: 'The Core Problem', percentageIn: 10, chapterHint: 'Chapter 1', description: 'Define the central problem your reader faces in vivid, specific terms.', prompt: 'Paint a detailed picture of the reader\'s core problem — the frustration, the cost, the daily pain of not solving it. Make them feel deeply seen.' },
    { id: 'nf-3', name: 'Agitate the Pain', percentageIn: 18, chapterHint: 'Chapter 2', description: 'Deepen the urgency — what happens if they ignore this problem?', prompt: 'Agitate the pain point by showing the long-term consequences of not acting — lost opportunities, relationships, money, or fulfillment.' },
    { id: 'nf-4', name: 'Root Cause Revelation', percentageIn: 25, chapterHint: 'Chapter 3', description: 'Reveal the surprising root cause most people miss.', prompt: 'Reveal the counter-intuitive truth about why the reader\'s problem persists. The real cause isn\'t what they think it is — and this insight reframes everything.' },
    { id: 'nf-5', name: 'The Framework / System', percentageIn: 35, chapterHint: 'Chapter 4', description: 'Present your unique system or framework as the solution.', prompt: 'Introduce your proprietary framework, system, or method. Give it a memorable name. Explain its pillars and why it works when everything else has failed.' },
    { id: 'nf-6', name: 'Case Study & Proof', percentageIn: 50, chapterHint: 'Chapters 5-7', description: 'Real stories and data that prove your framework works.', prompt: 'Write a compelling case study of someone who applied your framework and achieved dramatic results. Make the transformation specific, believable, and inspiring.' },
    { id: 'nf-7', name: 'Step-by-Step Action Plan', percentageIn: 65, chapterHint: 'Chapters 7-9', description: 'Chapters dedicated to implementing each step of the system.', prompt: 'Write a practical action chapter — one specific step of your system with clear instructions, common mistakes to avoid, and a chapter-end exercise for the reader.' },
    { id: 'nf-8', name: 'Overcoming Obstacles', percentageIn: 80, chapterHint: 'Chapter 10', description: 'Address the objections and obstacles readers will face.', prompt: 'Anticipate the three most common objections or obstacles your reader will face when implementing your system, and provide specific, empowering responses to each.' },
    { id: 'nf-9', name: 'Call to Action & Vision', percentageIn: 90, chapterHint: 'Conclusion', description: 'Paint the transformed future and deliver a clear call to action.', prompt: 'Close with a vivid vision of the reader\'s transformed life after applying your framework. Issue a clear, confident call to action and leave them inspired to begin immediately.' },
  ],
};

// ─────────────────────────────────────────────────────────────
// 6. Thriller 7-Point Pacing Curve
// ─────────────────────────────────────────────────────────────
export const THRILLER_7POINT: StoryFramework = {
  id: 'thriller-7point',
  name: 'Thriller 7-Point Pacing Curve',
  shortName: 'Thriller',
  genre: 'Thriller, Mystery, Suspense, Crime',
  description: 'Dan Wells\' 7-Point Story Structure optimized for page-turning tension and relentless pacing in thriller and suspense fiction.',
  creditedTo: 'Dan Wells',
  totalBeats: 7,
  beats: [
    { id: 't7-1', name: 'Hook', percentageIn: 1, chapterHint: 'Chapter 1 (Opening Shock)', description: 'An immediate, gripping scene that demands the reader continue.', prompt: 'Open with a shocking, disorienting, or deeply intriguing scene that creates an immediate question demanding an answer. In media res works brilliantly here.' },
    { id: 't7-2', name: 'Plot Turn 1', percentageIn: 20, chapterHint: 'Chapter 3-4', description: 'A revelation that complicates everything and locks the protagonist in.', prompt: 'Deliver the first major plot twist — new information that raises the stakes dramatically and makes it impossible for your protagonist to simply walk away.' },
    { id: 't7-3', name: 'Pinch 1', percentageIn: 35, chapterHint: 'Chapter 5-6', description: 'Pressure forces the protagonist to act — antagonist\'s power demonstrated.', prompt: 'Show the antagonist\'s full threat — a demonstration of power, a direct attack on the protagonist\'s world, or a death that proves no one is safe.' },
    { id: 't7-4', name: 'Midpoint', percentageIn: 50, chapterHint: 'Chapter 7-8 (False Solution)', description: 'The protagonist thinks they\'ve solved the problem — but they haven\'t.', prompt: 'Your protagonist achieves a false victory — they believe they\'ve caught the killer or solved the mystery. But write the crack that reveals they\'ve been wrong about everything.' },
    { id: 't7-5', name: 'Pinch 2', percentageIn: 65, chapterHint: 'Chapter 9-10', description: 'The darkest moment — the protagonist loses nearly everything.', prompt: 'The antagonist strikes at the protagonist\'s deepest vulnerability. A betrayal by an ally, a loved one in danger, or the protagonist trapped with no apparent way out.' },
    { id: 't7-6', name: 'Plot Turn 2', percentageIn: 80, chapterHint: 'Chapter 11', description: 'A final revelation gives the protagonist what they need to win.', prompt: 'Write the crucial revelation — a piece of information, an unexpected ally, or a realization about the antagonist\'s weakness that gives your protagonist a fighting chance.' },
    { id: 't7-7', name: 'Resolution', percentageIn: 90, chapterHint: 'Chapter 12-14 (Climax)', description: 'The climax — protagonist confronts the antagonist using all they\'ve learned.', prompt: 'Write the climax where your protagonist, transformed by the journey, confronts the antagonist in a final showdown. Deliver justice, truth, or survival — with one last unexpected twist.' },
  ],
};

export const ALL_FRAMEWORKS: StoryFramework[] = [
  SAVE_THE_CAT,
  HEROS_JOURNEY,
  THREE_ACT,
  ROMANCE_BEATS,
  NONFICTION_PAS,
  THRILLER_7POINT,
];

/**
 * Generate a chapter list from a story beat framework
 */
export function generateChaptersFromFramework(
  framework: StoryFramework,
  bookTitle: string = 'My Book',
  totalTargetWords: number = 60000
): { id: string; title: string; targetWords: number; beatPrompt: string }[] {
  return framework.beats.map((beat, idx) => {
    const isLast = idx === framework.beats.length - 1;
    const nextPercent = isLast ? 100 : framework.beats[idx + 1].percentageIn;
    const rangePercent = nextPercent - beat.percentageIn;
    const targetWords = Math.max(500, Math.round((rangePercent / 100) * totalTargetWords));

    return {
      id: `beat-${beat.id}-${Date.now()}-${idx}`,
      title: beat.chapterHint.includes('Chapter') ? beat.chapterHint : `${beat.chapterHint}`,
      targetWords,
      beatPrompt: beat.prompt,
    };
  });
}

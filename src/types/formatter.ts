/**
 * KDP Formatter Tool Types
 * Supports 3-panel layout, block classification, KDP formatting parameters, and DOCX generation.
 */

export type BlockType =
  | 'title'           // # THE ASSERTIVE NURSE
  | 'subtitle'        // ## Subtitle line
  | 'front_matter'    // ## COPYRIGHT PAGE, ## DISCLAIMER
  | 'toc'             // ## CONTENTS / TABLE OF CONTENTS with structured TocItem entries
  | 'part'            // # PART ONE: THE FOUNDATION
  | 'chapter'         // ## CHAPTER 1: KNOW YOUR...
  | 'section'         // ### Section title
  | 'subsection'      // #### Subsection
  | 'exercise_header' // EXERCISE 1.1: NAME
  | 'exercise_body'   // Exercise instructions / body text
  | 'exercise_group'  // Unified composite exercise container
  | 'scenario_header' // SCENARIO A: NAME
  | 'scenario_body'   // Scenario description
  | 'scenario_group'  // Unified composite scenario container
  | 'model_response'  // MODEL RESPONSE: or **Model Response:**
  | 'debrief'         // DEBRIEF: or **Debrief:**
  | 'reflection'      // REFLECTION PROMPT or Reflection prompt:
  | 'action'          // ACTION PLAN:
  | 'key_takeaways'   // KEY TAKEAWAYS: or SUMMARY:
  | 'quote'           // > Blockquote / pull quote
  | 'list'            // - item / 1. item list block
  | 'table'           // markdown table | col | col |
  | 'lines'           // _____ writing lines
  | 'paragraph'       // regular body text
  | 'divider'         // --- horizontal rule
  | 'blank';          // empty line

export interface TocItem {
  title: string;
  isPart: boolean;
  isAppendix: boolean;
  isFrontMatter: boolean;
  level: number;
  pageNumber?: number;
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  text: string;
  rawText?: string;
  lines?: string[];
  metadata?: Record<string, any>;
}

export type TrimSizeOption = '7x10' | '6x9' | '5.5x8.5' | '8.5x11' | 'custom';
export type FontOption = 'Georgia' | 'Garamond' | 'Times New Roman' | 'Palatino';
export type HeadingFontOption = 'Cinzel' | 'Playfair Display' | 'Montserrat' | 'Georgia';
export type FontSizeOption = '10pt' | '11pt' | '12pt';
export type LineSpacingOption = '1.0' | '1.15' | '1.2' | '1.5';
export type MarginPresetOption = 'workbook' | 'standard' | 'minimal' | 'custom';
export type PaperColorOption = 'white' | 'cream';
export type InteriorColorOption = 'bw' | 'color';
export type BleedOption = 'none' | '0.125';
export type BindingTypeOption = 'paperback' | 'hardcover';
export type AccentThemeOption = 'purple' | 'teal' | 'navy' | 'burgundy' | 'charcoal' | 'green';

export interface MarginSettings {
  inside: number;  // inches (gutter)
  outside: number; // inches
  top: number;     // inches
  bottom: number;  // inches
}

export interface KdpFormatSettings {
  trimSize: TrimSizeOption;
  trimWidth: number;   // inches
  trimHeight: number;  // inches
  font: FontOption;
  headingFont?: HeadingFontOption;
  fontSize: number;    // half-points in DOCX (11pt = 22)
  fontSizeLabel: FontSizeOption;
  lineSpacing: LineSpacingOption;
  lineSpacingValue: number; // DOCX line value (276 for 1.15)
  marginPreset: MarginPresetOption;
  margins: MarginSettings;
  paperColor: PaperColorOption;
  interiorColor: InteriorColorOption;
  
  // Advanced Print Settings
  bleed?: BleedOption;
  bindingType?: BindingTypeOption;
  accentTheme?: AccentThemeOption;
  isCustomTrim?: boolean;
  
  // Content Feature Toggles
  formatExerciseBoxes: boolean;
  formatScenarioBlocks: boolean;
  formatModelResponses: boolean;
  formatDebriefBlocks: boolean;
  formatReflectionPrompts: boolean;
  formatActionPlans?: boolean;
  formatKeyTakeaways?: boolean;
  formatCalloutBoxes?: boolean;
  addWritingLines: boolean;
  chapterPageBreaks: boolean;
  generateTocPlaceholder: boolean;
  dropCapsFirstParagraph?: boolean;
  headerFooterFolios?: boolean;
  ornamentalDividers?: boolean;
  paragraphIndent?: boolean;
  
  // KDP Metadata
  title: string;
  subtitle: string;
  author: string;
}

export interface FormatterStats {
  wordCount: number;
  chapterCount: number;
  estimatedPages: number;
  partCount: number;
  exerciseCount: number;
  scenarioCount: number;
  tableCount: number;
}

export interface ChapterNavNode {
  id: string;
  title: string;
  type: 'chapter' | 'part' | 'front_matter';
  blockIndex: number;
}

export interface FontPairing {
  id: string;
  name: string;
  genre: string;
  titleFont: string;
  subtitleFont: string;
  bodyFont: string;
  preview: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'epic-fantasy',
    name: 'Cinzel & Montserrat',
    genre: 'Fantasy / Sci-Fi / Historical',
    titleFont: 'Cinzel',
    subtitleFont: 'Montserrat',
    bodyFont: 'Lora',
    preview: 'THE ANCIENT CHRONICLES',
  },
  {
    id: 'literary-romance',
    name: 'Playfair & Inter',
    genre: 'Romance / Literary / Drama',
    titleFont: 'Playfair Display',
    subtitleFont: 'Montserrat',
    bodyFont: 'Merriweather',
    preview: 'A Season of Whispers',
  },
  {
    id: 'thriller-noir',
    name: 'Oswald & Merriweather',
    genre: 'Thriller / Crime / Horror',
    titleFont: 'Oswald',
    subtitleFont: 'Roboto Slab',
    bodyFont: 'Georgia',
    preview: 'THE SILENT WITNESS',
  },
  {
    id: 'modern-business',
    name: 'Anton & Poppins',
    genre: 'Self-Help / Business / Tech',
    titleFont: 'Anton',
    subtitleFont: 'Poppins',
    bodyFont: 'Montserrat',
    preview: 'UNSTOPPABLE MOMENTUM',
  },
  {
    id: 'poetic-memoir',
    name: 'Cormorant & Alegreya',
    genre: 'Poetry / Memoir / Philosophy',
    titleFont: 'Cormorant Garamond',
    subtitleFont: 'Alegreya',
    bodyFont: 'EB Garamond',
    preview: 'Where Wildflowers Bloom',
  },
  {
    id: 'vintage-gothic',
    name: 'Cinzel Decorative & Cinzel',
    genre: 'Gothic / Dark Fantasy / Mystery',
    titleFont: 'Cinzel Decorative',
    subtitleFont: 'Cinzel',
    bodyFont: 'Playfair Display',
    preview: 'SHADOW OF THE CITADEL',
  },
];

export interface MeshGradient {
  id: string;
  name: string;
  category: 'Dark' | 'Vibrant' | 'Warm' | 'Aesthetic';
  stops: string[];
  angle: number;
}

export const MESH_GRADIENTS: MeshGradient[] = [
  { id: 'midnight-noir', name: 'Midnight Noir', category: 'Dark', stops: ['#0f172a', '#1e1b4b', '#020617'], angle: 135 },
  { id: 'crimson-ember', name: 'Crimson Ember', category: 'Dark', stops: ['#450a0a', '#1c1917', '#7f1d1d'], angle: 160 },
  { id: 'deep-emerald', name: 'Deep Emerald', category: 'Dark', stops: ['#022c22', '#064e3b', '#0f172a'], angle: 140 },
  { id: 'royal-velvet', name: 'Royal Velvet', category: 'Dark', stops: ['#3b0764', '#1e1b4b', '#09090b'], angle: 135 },
  { id: 'golden-hour', name: 'Golden Hour', category: 'Warm', stops: ['#78350f', '#b45309', '#1c1917'], angle: 120 },
  { id: 'rose-nebula', name: 'Rose Nebula', category: 'Warm', stops: ['#831843', '#4c0519', '#1e1b4b'], angle: 145 },
  { id: 'nordic-frost', name: 'Nordic Frost', category: 'Vibrant', stops: ['#082f49', '#0e7490', '#164e63'], angle: 150 },
  { id: 'cyber-violet', name: 'Cyber Violet', category: 'Vibrant', stops: ['#581c87', '#1e1b4b', '#06b6d4'], angle: 135 },
  { id: 'parchment-cream', name: 'Parchment Cream', category: 'Aesthetic', stops: ['#fef3c7', '#fde68a', '#f59e0b'], angle: 180 },
  { id: 'slate-minimal', name: 'Slate Minimal', category: 'Aesthetic', stops: ['#334155', '#1e293b', '#0f172a'], angle: 135 },
  { id: 'terracotta-sun', name: 'Terracotta Sun', category: 'Warm', stops: ['#9a3412', '#ea580c', '#431407'], angle: 130 },
  { id: 'astral-teal', name: 'Astral Teal', category: 'Vibrant', stops: ['#134e4a', '#047857', '#064e3b'], angle: 140 },
];

export interface GraphicElementItem {
  id: string;
  title: string;
  category: 'Badges' | 'Flourishes' | 'Silhouettes' | 'Frames';
  svgString: string;
  defaultWidth: number;
  defaultHeight: number;
}

export const GRAPHIC_ELEMENTS: GraphicElementItem[] = [
  // 1. BADGES
  {
    id: 'badge-nyt-bestseller',
    title: '#1 Bestseller Ribbon',
    category: 'Badges',
    defaultWidth: 260,
    defaultHeight: 52,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 52" width="260" height="52">
      <rect x="2" y="2" width="256" height="48" rx="8" fill="#ca8a04" stroke="#fef08a" stroke-width="2"/>
      <text x="130" y="32" font-family="Arial, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">★ #1 BESTSELLER ★</text>
    </svg>`,
  },
  {
    id: 'badge-award-laurel',
    title: 'Award Winner Laurel Seal',
    category: 'Badges',
    defaultWidth: 140,
    defaultHeight: 140,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" width="140" height="140">
      <circle cx="70" cy="70" r="62" fill="none" stroke="#eab308" stroke-width="3" stroke-dasharray="4,2"/>
      <circle cx="70" cy="70" r="54" fill="#854d0e" stroke="#fef08a" stroke-width="1.5"/>
      <text x="70" y="58" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="#fef08a" text-anchor="middle">AWARD</text>
      <text x="70" y="74" font-family="Georgia, serif" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">WINNER</text>
      <text x="70" y="88" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#fef08a" text-anchor="middle" letter-spacing="1">★ ★ ★</text>
    </svg>`,
  },
  {
    id: 'badge-special-edition',
    title: 'Special Edition Seal',
    category: 'Badges',
    defaultWidth: 130,
    defaultHeight: 130,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130" width="130" height="130">
      <polygon points="65,5 82,24 107,18 113,44 135,58 126,83 135,108 110,117 101,141 76,133 55,145 42,123 17,126 15,100 0,81 14,59 7,33 32,28 42,5" fill="#dc2626" stroke="#fef2f2" stroke-width="2"/>
      <text x="65" y="62" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">SPECIAL</text>
      <text x="65" y="78" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">EDITION</text>
    </svg>`,
  },
  {
    id: 'badge-nyt-author',
    title: 'NYT Bestselling Author Pill',
    category: 'Badges',
    defaultWidth: 280,
    defaultHeight: 38,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 38" width="280" height="38">
      <rect x="2" y="2" width="276" height="34" rx="17" fill="#1e1b4b" stroke="#a855f7" stroke-width="1.5"/>
      <text x="140" y="24" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="#e9d5ff" text-anchor="middle" letter-spacing="1.5">NEW YORK TIMES BESTSELLING AUTHOR</text>
    </svg>`,
  },

  // 2. FLOURISHES & DIVIDERS
  {
    id: 'flourish-victorian-divider',
    title: 'Victorian Filigree Divider',
    category: 'Flourishes',
    defaultWidth: 320,
    defaultHeight: 28,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 28" width="320" height="28">
      <path d="M10,14 L120,14 M200,14 L310,14" stroke="#ca8a04" stroke-width="2" stroke-linecap="round"/>
      <polygon points="160,4 168,14 160,24 152,14" fill="#ca8a04"/>
      <circle cx="138" cy="14" r="4" fill="#ca8a04"/>
      <circle cx="182" cy="14" r="4" fill="#ca8a04"/>
    </svg>`,
  },
  {
    id: 'flourish-minimal-line',
    title: 'Modern Diamond Divider',
    category: 'Flourishes',
    defaultWidth: 280,
    defaultHeight: 20,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 20" width="280" height="20">
      <line x1="20" y1="10" x2="120" y2="10" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="160" y1="10" x2="260" y2="10" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="135" y="5" width="10" height="10" transform="rotate(45 140 10)" fill="#a855f7"/>
    </svg>`,
  },
  {
    id: 'flourish-starburst',
    title: 'Golden Starburst Accent',
    category: 'Flourishes',
    defaultWidth: 60,
    defaultHeight: 60,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
      <path d="M30,0 L34,22 L56,12 L38,30 L56,48 L34,38 L30,60 L26,38 L4,48 L22,30 L4,12 L26,22 Z" fill="#eab308"/>
    </svg>`,
  },

  // 3. SILHOUETTES & ICONS
  {
    id: 'silhouette-sword',
    title: 'Fantasy Sword Silhouette',
    category: 'Silhouettes',
    defaultWidth: 50,
    defaultHeight: 180,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 180" width="50" height="180">
      <path d="M25,0 L32,30 L28,140 L45,140 L45,148 L28,148 L28,170 L22,170 L22,148 L5,148 L5,140 L22,140 L18,30 Z" fill="#ffffff" opacity="0.9"/>
      <circle cx="25" cy="175" r="5" fill="#ca8a04"/>
    </svg>`,
  },
  {
    id: 'silhouette-dragon',
    title: 'Dragon Crest Silhouette',
    category: 'Silhouettes',
    defaultWidth: 160,
    defaultHeight: 130,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 130" width="160" height="130">
      <path d="M80,10 C100,20 130,10 150,35 C120,40 105,65 115,95 C95,80 85,90 75,115 C70,90 55,80 40,95 C50,65 35,40 10,35 C30,10 60,20 80,10 Z" fill="#ca8a04" opacity="0.95"/>
    </svg>`,
  },
  {
    id: 'silhouette-tree',
    title: 'Misty Pine Tree Silhouette',
    category: 'Silhouettes',
    defaultWidth: 80,
    defaultHeight: 160,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 160" width="80" height="160">
      <polygon points="40,5 55,40 48,40 62,75 52,75 70,120 45,120 45,155 35,155 35,120 10,120 28,75 18,75 32,40 25,40" fill="#0f172a"/>
    </svg>`,
  },
  {
    id: 'silhouette-quill',
    title: 'Vintage Quill Pen',
    category: 'Silhouettes',
    defaultWidth: 70,
    defaultHeight: 150,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 150" width="70" height="150">
      <path d="M60,5 C40,15 20,45 15,80 C12,100 8,125 0,145 L10,140 C20,115 30,90 40,70 C55,50 65,25 60,5 Z" fill="#ca8a04"/>
    </svg>`,
  },

  // 4. FRAMES & BORDERS
  {
    id: 'frame-ornate-corner',
    title: 'Victorian Corner Frame Accents',
    category: 'Frames',
    defaultWidth: 300,
    defaultHeight: 440,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 440" width="300" height="440">
      <rect x="15" y="15" width="270" height="410" fill="none" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="6,3"/>
      <!-- Top Left -->
      <path d="M8,40 L8,8 L40,8" fill="none" stroke="#ca8a04" stroke-width="3"/>
      <!-- Top Right -->
      <path d="M260,8 L292,8 L292,40" fill="none" stroke="#ca8a04" stroke-width="3"/>
      <!-- Bottom Left -->
      <path d="M8,400 L8,432 L40,432" fill="none" stroke="#ca8a04" stroke-width="3"/>
      <!-- Bottom Right -->
      <path d="M260,432 L292,432 L292,400" fill="none" stroke="#ca8a04" stroke-width="3"/>
    </svg>`,
  },
];

export interface GenreTemplatePreset {
  id: string;
  genre: string;
  name: string;
  description: string;
  bgColor: string;
  titleText: string;
  titleFont: string;
  titleColor: string;
  titleSize: number;
  subtitleText: string;
  subtitleFont: string;
  subtitleColor: string;
  authorText: string;
  authorFont: string;
  authorColor: string;
  spineText: string;
  blurbText: string;
  badgeId?: string;
  flourishId?: string;
}

export const GENRE_TEMPLATES: GenreTemplatePreset[] = [
  {
    id: 'template-epic-fantasy',
    genre: 'Fantasy & Sci-Fi',
    name: 'Crown of Shadows',
    description: 'Deep royal cosmic gradient, ornate gold typography, and royal crest.',
    bgColor: '#0f172a',
    titleText: 'THE CHRONICLES OF ELDON',
    titleFont: 'Cinzel Decorative',
    titleColor: '#fef08a',
    titleSize: 42,
    subtitleText: 'Book One in the Eldoria Realm Series',
    subtitleFont: 'Montserrat',
    subtitleColor: '#cbd5e1',
    authorText: 'ARTHUR VANCE',
    authorFont: 'Cinzel',
    authorColor: '#fef08a',
    spineText: 'THE CHRONICLES OF ELDON • ARTHUR VANCE',
    blurbText: 'In a fractured empire bound by ancient oaths, one rogue guardian holds the key to the lost elemental throne. A breathtaking epic of destiny, betrayal, and forgotten magic.',
    badgeId: 'badge-nyt-bestseller',
    flourishId: 'flourish-victorian-divider',
  },
  {
    id: 'template-thriller-mystery',
    genre: 'Thriller & Mystery',
    name: 'Midnight Alley',
    description: 'High-contrast noir layout with bold typography and blood-red accent lines.',
    bgColor: '#020617',
    titleText: 'THE SILENT ALIBI',
    titleFont: 'Oswald',
    titleColor: '#ffffff',
    titleSize: 52,
    subtitleText: 'A Gripping Psychological Detective Thriller',
    subtitleFont: 'Roboto Slab',
    subtitleColor: '#ef4444',
    authorText: 'MARCUS REED',
    authorFont: 'Oswald',
    authorColor: '#ffffff',
    spineText: 'THE SILENT ALIBI • MARCUS REED',
    blurbText: 'When the city’s premier defense attorney is accused of the crime she was hired to solve, 24 hours is all that separates truth from total annihilation.',
    badgeId: 'badge-nyt-author',
    flourishId: 'flourish-minimal-line',
  },
  {
    id: 'template-contemporary-romance',
    genre: 'Romance & Fiction',
    name: 'Love in Paris',
    description: 'Warm aesthetic rose-gold palette with italic serifs and delicate accents.',
    bgColor: '#2a081a',
    titleText: 'Whispers at Sunset',
    titleFont: 'Playfair Display',
    titleColor: '#fbcfe8',
    titleSize: 46,
    subtitleText: 'An Unforgettable Summer of Second Chances',
    subtitleFont: 'Montserrat',
    subtitleColor: '#f472b6',
    authorText: 'Elena Rostova',
    authorFont: 'Playfair Display',
    authorColor: '#ffffff',
    spineText: 'Whispers at Sunset • Elena Rostova',
    blurbText: 'A chance meeting on the Amalfi coast rekindles an old promise that two hearts thought time had erased forever. A sweeping romantic escape.',
    badgeId: 'badge-award-laurel',
  },
  {
    id: 'template-business-selfhelp',
    genre: 'Self-Help & Business',
    name: 'The 10x Velocity',
    description: 'Clean authoritative minimalism with high-impact headline and executive subtitle.',
    bgColor: '#18181b',
    titleText: 'UNSTOPPABLE VELOCITY',
    titleFont: 'Anton',
    titleColor: '#fbbf24',
    titleSize: 50,
    subtitleText: 'How High Performers Scale Growth and Master Daily Focus',
    subtitleFont: 'Poppins',
    subtitleColor: '#e4e4e7',
    authorText: 'DAVID C. STERLING',
    authorFont: 'Poppins',
    authorColor: '#ffffff',
    spineText: 'UNSTOPPABLE VELOCITY • DAVID STERLING',
    blurbText: 'Discover the actionable blueprint used by top entrepreneurs to eliminate cognitive fatigue, amplify daily leverage, and build enduring competitive moats.',
    badgeId: 'badge-nyt-bestseller',
  },
  {
    id: 'template-poetry-memoir',
    genre: 'Poetry & Memoir',
    name: 'Wildflower Bloom',
    description: 'Ethereal literary aesthetic with delicate serifs and nature line-art.',
    bgColor: '#142820',
    titleText: 'Where the Wild Moss Grows',
    titleFont: 'Cormorant Garamond',
    titleColor: '#bbf7d0',
    titleSize: 44,
    subtitleText: 'Poems on Solitude, Healing & Renewal',
    subtitleFont: 'Alegreya',
    subtitleColor: '#86efac',
    authorText: 'Clara Hayes',
    authorFont: 'Cormorant Garamond',
    authorColor: '#ffffff',
    spineText: 'Where the Wild Moss Grows • Clara Hayes',
    blurbText: 'A deeply personal anthology exploring the quiet architecture of healing, grief, and the tender joy of finding oneself in the natural world.',
    flourishId: 'flourish-starburst',
  },
  {
    id: 'template-low-content-planner',
    genre: 'Low Content / Journal',
    name: 'Golden Grid Journal',
    description: 'Sophisticated gold border with clean minimal heading for logbooks & planners.',
    bgColor: '#1e1b4b',
    titleText: 'DAILY REFLECTION JOURNAL',
    titleFont: 'Montserrat',
    titleColor: '#fef08a',
    titleSize: 34,
    subtitleText: '90-Day Mindful Habit Tracker & Weekly Gratitude Log',
    subtitleFont: 'Montserrat',
    subtitleColor: '#cbd5e1',
    authorText: 'KDP CREATIVE EDITIONS',
    authorFont: 'Montserrat',
    authorColor: '#fef08a',
    spineText: 'DAILY REFLECTION JOURNAL',
    blurbText: 'Structured 90-day daily prompts designed to cultivate intentional mindfulness, clarify priority goals, and track personal transformation.',
    flourishId: 'frame-ornate-corner',
  },
];

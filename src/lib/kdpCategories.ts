/**
 * Standard Amazon KDP and BISAC Subject Categories Database
 */
export interface BisacCategory {
  code: string;
  majorCategory: string;
  subCategory: string;
  name: string;
  browseNodePath: string;
  keywords: string[];
}

export const BISAC_CATEGORIES: BisacCategory[] = [
  // Fiction - Fantasy
  {
    code: 'FIC009000',
    majorCategory: 'Fiction',
    subCategory: 'Fantasy',
    name: 'Fiction / Fantasy / General',
    browseNodePath: 'Books > Science Fiction & Fantasy > Fantasy',
    keywords: ['magic', 'dragons', 'sorcery', 'wizard', 'kingdom'],
  },
  {
    code: 'FIC009020',
    majorCategory: 'Fiction',
    subCategory: 'Fantasy',
    name: 'Fiction / Fantasy / Epic',
    browseNodePath: 'Books > Science Fiction & Fantasy > Fantasy > Epic',
    keywords: ['worldbuilding', 'high fantasy', 'quest', 'empire', 'swords'],
  },
  {
    code: 'FIC009010',
    majorCategory: 'Fiction',
    subCategory: 'Fantasy',
    name: 'Fiction / Fantasy / Dark Fantasy',
    browseNodePath: 'Books > Science Fiction & Fantasy > Fantasy > Dark Fantasy',
    keywords: ['grimdark', 'horror fantasy', 'necromancy', 'demons'],
  },
  {
    code: 'FIC009050',
    majorCategory: 'Fiction',
    subCategory: 'Fantasy',
    name: 'Fiction / Fantasy / Contemporary & Urban',
    browseNodePath: 'Books > Science Fiction & Fantasy > Fantasy > Urban',
    keywords: ['urban fantasy', 'modern magic', 'paranormal city', 'vampires'],
  },

  // Fiction - Science Fiction
  {
    code: 'FIC028000',
    majorCategory: 'Fiction',
    subCategory: 'Science Fiction',
    name: 'Fiction / Science Fiction / General',
    browseNodePath: 'Books > Science Fiction & Fantasy > Science Fiction',
    keywords: ['sci-fi', 'futuristic', 'aliens', 'technology'],
  },
  {
    code: 'FIC028010',
    majorCategory: 'Fiction',
    subCategory: 'Science Fiction',
    name: 'Fiction / Science Fiction / Space Opera',
    browseNodePath: 'Books > Science Fiction & Fantasy > Science Fiction > Space Opera',
    keywords: ['spaceships', 'galactic empire', 'fleet', 'galaxy', 'interstellar'],
  },
  {
    code: 'FIC028020',
    majorCategory: 'Fiction',
    subCategory: 'Science Fiction',
    name: 'Fiction / Science Fiction / Cyberpunk',
    browseNodePath: 'Books > Science Fiction & Fantasy > Science Fiction > Cyberpunk',
    keywords: ['ai', 'hacking', 'virtual reality', 'megacorporations', 'dystopia'],
  },
  {
    code: 'FIC028030',
    majorCategory: 'Fiction',
    subCategory: 'Science Fiction',
    name: 'Fiction / Science Fiction / Post-Apocalyptic',
    browseNodePath: 'Books > Science Fiction & Fantasy > Science Fiction > Dystopian',
    keywords: ['survival', 'apocalypse', 'wasteland', 'ruins', 'fallout'],
  },

  // Fiction - Mystery & Thriller
  {
    code: 'FIC022000',
    majorCategory: 'Fiction',
    subCategory: 'Mystery & Detective',
    name: 'Fiction / Mystery & Detective / General',
    browseNodePath: 'Books > Mystery, Thriller & Suspense > Mystery',
    keywords: ['whodunit', 'detective', 'murder mystery', 'clues', 'investigation'],
  },
  {
    code: 'FIC022040',
    majorCategory: 'Fiction',
    subCategory: 'Mystery & Detective',
    name: 'Fiction / Mystery & Detective / Cozy',
    browseNodePath: 'Books > Mystery, Thriller & Suspense > Mystery > Cozy',
    keywords: ['amateur sleuth', 'small town', 'culinary', 'crafts', 'lighthearted'],
  },
  {
    code: 'FIC030000',
    majorCategory: 'Fiction',
    subCategory: 'Thrillers',
    name: 'Fiction / Thrillers / Psychological',
    browseNodePath: 'Books > Mystery, Thriller & Suspense > Thrillers > Psychological',
    keywords: ['mind games', 'unreliable narrator', 'domestic thriller', 'secrets'],
  },
  {
    code: 'FIC031000',
    majorCategory: 'Fiction',
    subCategory: 'Thrillers',
    name: 'Fiction / Thrillers / Crime & Espionage',
    browseNodePath: 'Books > Mystery, Thriller & Suspense > Thrillers > Espionage',
    keywords: ['spies', 'cia', 'black ops', 'conspiracy', 'covert'],
  },

  // Fiction - Romance
  {
    code: 'FIC027000',
    majorCategory: 'Fiction',
    subCategory: 'Romance',
    name: 'Fiction / Romance / Contemporary',
    browseNodePath: 'Books > Romance > Contemporary',
    keywords: ['love story', 'modern romance', 'enemies to lovers', 'billionaire'],
  },
  {
    code: 'FIC027050',
    majorCategory: 'Fiction',
    subCategory: 'Romance',
    name: 'Fiction / Romance / Historical',
    browseNodePath: 'Books > Romance > Historical',
    keywords: ['regency', 'victorian', 'highlanders', 'dukes', 'period drama'],
  },
  {
    code: 'FIC027060',
    majorCategory: 'Fiction',
    subCategory: 'Romance',
    name: 'Fiction / Romance / Paranormal',
    browseNodePath: 'Books > Romance > Paranormal',
    keywords: ['shifters', 'vampires', 'fated mates', 'werewolves', 'fae'],
  },

  // Non-Fiction - Self-Help & Personal Growth
  {
    code: 'SEL000000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Self-Help',
    name: 'Self-Help / General',
    browseNodePath: 'Books > Self-Help',
    keywords: ['personal growth', 'mindset', 'habits', 'motivation', 'life skills'],
  },
  {
    code: 'SEL021000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Self-Help',
    name: 'Self-Help / Motivational & Inspirational',
    browseNodePath: 'Books > Self-Help > Motivational',
    keywords: ['success', 'goal setting', 'discipline', 'positive thinking'],
  },
  {
    code: 'SEL016000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Self-Help',
    name: 'Self-Help / Personal Growth / Success',
    browseNodePath: 'Books > Self-Help > Personal Transformation',
    keywords: ['productivity', 'high performance', 'time management', 'clarity'],
  },
  {
    code: 'SEL027000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Self-Help',
    name: 'Self-Help / Stress Management & Mindfulness',
    browseNodePath: 'Books > Self-Help > Stress Management',
    keywords: ['anxiety', 'calm', 'meditation', 'mental clarity', 'peace'],
  },

  // Non-Fiction - Business & Money
  {
    code: 'BUS000000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Business & Economics',
    name: 'Business & Economics / General',
    browseNodePath: 'Books > Business & Money',
    keywords: ['business', 'commerce', 'strategy', 'leadership'],
  },
  {
    code: 'BUS025000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Business & Economics',
    name: 'Business & Economics / Entrepreneurship',
    browseNodePath: 'Books > Business & Money > Entrepreneurship & Small Business',
    keywords: ['startups', 'founders', 'scaling', 'venture', 'solopreneur'],
  },
  {
    code: 'BUS050000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Business & Economics',
    name: 'Business & Economics / Personal Finance',
    browseNodePath: 'Books > Business & Money > Personal Finance > Money Management',
    keywords: ['investing', 'wealth', 'budgeting', 'financial freedom', 'real estate'],
  },
  {
    code: 'BUS043000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Business & Economics',
    name: 'Business & Economics / Marketing & Sales',
    browseNodePath: 'Books > Business & Money > Marketing & Sales',
    keywords: ['branding', 'advertising', 'copywriting', 'growth', 'sales strategy'],
  },

  // Non-Fiction - Health & Wellness
  {
    code: 'HEA000000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Health & Fitness',
    name: 'Health & Fitness / General',
    browseNodePath: 'Books > Health, Fitness & Dieting',
    keywords: ['wellness', 'longevity', 'vitality', 'nutrition'],
  },
  {
    code: 'HEA006000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Health & Fitness',
    name: 'Health & Fitness / Diet & Nutrition',
    browseNodePath: 'Books > Health, Fitness & Dieting > Diets & Weight Loss',
    keywords: ['keto', 'intermittent fasting', 'plant-based', 'recipes', 'gut health'],
  },
  {
    code: 'HEA007000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Health & Fitness',
    name: 'Health & Fitness / Exercise & Fitness',
    browseNodePath: 'Books > Health, Fitness & Dieting > Exercise & Fitness',
    keywords: ['strength training', 'mobility', 'cardio', 'workout routines', 'yoga'],
  },

  // Non-Fiction - Biography & Memoir
  {
    code: 'BIO000000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Biography & Autobiography',
    name: 'Biography & Autobiography / General',
    browseNodePath: 'Books > Biographies & Memoirs',
    keywords: ['life story', 'memoir', 'true story', 'historical figures'],
  },
  {
    code: 'BIO026000',
    majorCategory: 'Non-Fiction',
    subCategory: 'Biography & Autobiography',
    name: 'Biography & Autobiography / Personal Memoirs',
    browseNodePath: 'Books > Biographies & Memoirs > Memoirs',
    keywords: ['personal journey', 'triumph', 'reflection', 'overcoming adversity'],
  },

  // Young Adult & Children's
  {
    code: 'YAF000000',
    majorCategory: 'Young Adult',
    subCategory: 'YA Fiction',
    name: 'Young Adult Fiction / General',
    browseNodePath: 'Books > Teen & Young Adult',
    keywords: ['teen', 'high school', 'young adult', 'coming of age'],
  },
  {
    code: 'YAF019000',
    majorCategory: 'Young Adult',
    subCategory: 'YA Fiction',
    name: 'Young Adult Fiction / Fantasy / Epic',
    browseNodePath: 'Books > Teen & Young Adult > Science Fiction & Fantasy > Fantasy',
    keywords: ['ya fantasy', 'chosen one', 'magic academy', 'royalty', 'rebels'],
  },
];

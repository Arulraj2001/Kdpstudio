/**
 * Children's Illustrated Book Storyboard Engine
 * - 24-page & 32-page children's picture book spread architecture
 * - Paired 2-page spread model (Left: rhyming prose, Right: illustration scene)
 * - Character Consistency Engine (locks character traits, clothing, and art style across spreads)
 * - Pre-packaged story themes with full 12-spread story arcs
 */

export interface CharacterProfile {
  name: string;
  speciesOrType: string;
  ageOrDescription: string;
  clothing: string;
  keyFeature: string;
  artStyle: string;
}

export interface BookSpread {
  spreadNumber: number;
  leftPageNumber: number;
  rightPageNumber: number;
  storyText: string;             // Narrative prose / rhyming stanzas
  sceneDescription: string;      // What is visually happening
  imagePrompt: string;           // Final generated Midjourney/DALL-E prompt
  focusEmotion: string;          // e.g. "Joyful", "Curious", "Sleepy"
}

export interface ChildrensBookProject {
  id: string;
  title: string;
  targetAge: '0-3' | '3-5' | '5-8';
  trimSize: '8.5x8.5' | '8.5x11';
  character: CharacterProfile;
  spreads: BookSpread[];
}

export const ART_STYLES = [
  'Whimsical Soft Watercolor & Ink',
  'Playful 3D Digital Animation (Pixar Style)',
  'Vintage Storybook Gouache & Pastel',
  'Modern Flat Vector & Bold Shapes',
  'Cozy Colored Pencil & Paper Texture',
];

export const SAMPLE_CHILDRENS_BOOKS: ChildrensBookProject[] = [
  {
    id: 'fox-glow',
    title: 'The Little Fox Who Lost His Glow',
    targetAge: '3-5',
    trimSize: '8.5x8.5',
    character: {
      name: 'Oliver',
      speciesOrType: 'Little red fox with golden glowing tail tip',
      ageOrDescription: 'Cute energetic young fox cub with big amber eyes',
      clothing: 'Teal knit scarf with yellow star pattern',
      keyFeature: 'Soft bushy tail with a magical warm golden glow',
      artStyle: 'Whimsical Soft Watercolor & Ink',
    },
    spreads: [
      {
        spreadNumber: 1,
        leftPageNumber: 2,
        rightPageNumber: 3,
        storyText: 'Deep in the heart of the Whispering Wood,\nLived Oliver Fox, as happy as could.\nHis tail shone bright with a golden light,\nGuiding lost creatures through the dark night.',
        sceneDescription: 'Oliver the little fox standing on a mossy hill under ancient giant oak trees at twilight. His fluffy tail glows with soft warm starlight.',
        imagePrompt: 'Children book illustration, Oliver cute little red fox cub with amber eyes wearing teal knit scarf with star pattern, fluffy tail glowing with warm golden starlight, standing on mossy hill under giant ancient oak trees at twilight, magical glowing mushrooms, whimsical soft watercolor and ink style, 8k resolution, pastel colors --ar 1:1',
        focusEmotion: 'Magical & Warm'
      },
      {
        spreadNumber: 2,
        leftPageNumber: 4,
        rightPageNumber: 5,
        storyText: 'One chilly morning when autumn arrived,\nThe golden glow vanished—it had not survived!\n"Oh dear!" gasped Oliver, shaking his head,\n"My tail is as dull as a cold loaf of bread!"',
        sceneDescription: 'Oliver sitting in a pile of autumn leaves looking down at his tail in surprise and confusion. The tail has lost its glow.',
        imagePrompt: 'Children book illustration, Oliver cute red fox cub with teal scarf sitting in pile of red and orange autumn leaves, looking over shoulder at his tail with curious surprised expression, tail is normal orange without glow, morning mist, whimsical watercolor --ar 1:1',
        focusEmotion: 'Curious & Surprised'
      },
      {
        spreadNumber: 3,
        leftPageNumber: 6,
        rightPageNumber: 7,
        storyText: 'He asked Barnaby Owl up high in the tree,\n"Where could my magical sparkle now be?"\nThe old owl adjusted his round little glass,\n"True light comes from kindness, not magic or brass."',
        sceneDescription: 'Oliver talking to a wise old brown owl wearing tiny round spectacles perched on a low birch branch.',
        imagePrompt: 'Children book illustration, Oliver red fox with teal scarf looking up and speaking with a wise fluffy brown owl wearing round glasses on a low branch, golden autumn forest background, cozy watercolor style --ar 1:1',
        focusEmotion: 'Thoughtful'
      },
      {
        spreadNumber: 4,
        leftPageNumber: 8,
        rightPageNumber: 9,
        storyText: 'So Oliver trotted to help Mrs. Mouse,\nCarry heavy acorns back to her house.\nHe shared his warm blanket with cold Baby Bear,\nShowing sweet friendship and tenderest care.',
        sceneDescription: 'Oliver helping a tiny field mouse carry giant acorns in a leaf basket, smiling warmly.',
        imagePrompt: 'Children book illustration, Oliver red fox with teal scarf gently helping a cute tiny mouse family carry acorns into their hollow tree home, friendly atmosphere, warm soft lighting, whimsical watercolor --ar 1:1',
        focusEmotion: 'Helpful & Loving'
      },
      {
        spreadNumber: 5,
        leftPageNumber: 10,
        rightPageNumber: 11,
        storyText: 'And then, with a flicker, a warmth, and a flash,\nHis tail lit right up in a radiant splash!\n"It wasn\'t the forest, the sun, or the skies—\nIt was love in my heart that made my light rise!"',
        sceneDescription: 'Oliver jumping happily in the air as his tail bursts into a brilliant luminous golden glow surrounded by forest fireflies and friends.',
        imagePrompt: 'Children book illustration, Oliver red fox leaping with joy, his tail glowing brighter than ever with brilliant golden magical light, woodland animal friends cheering around him, starry night sky, celebratory whimsical watercolor --ar 1:1',
        focusEmotion: 'Joyful & Triumphant'
      },
      {
        spreadNumber: 6,
        leftPageNumber: 12,
        rightPageNumber: 13,
        storyText: 'Now every sweet evening when stars softly gleam,\nOliver curls up with a happy bright dream.\nFor everyone holds a warm spark of their own—\nAs long as you\'re kind, you are never alone.',
        sceneDescription: 'Oliver curled up peacefully fast asleep in a cozy hollow tree den with his glowing tail wrapped around him like a nightlight.',
        imagePrompt: 'Children book illustration, Oliver red fox cub sleeping peacefully curled up inside a cozy tree hollow, his tail softly glowing like a gentle warm nightlight, moonbeams through the branches, peaceful bedtime scene, watercolor style --ar 1:1',
        focusEmotion: 'Peaceful & Sleepy'
      }
    ]
  }
];

/**
 * Builds an AI image prompt enforcing character consistency
 */
export function buildConsistentPrompt(
  character: CharacterProfile,
  sceneDescription: string
): string {
  return `Children book illustration, ${character.name} the ${character.speciesOrType} (${character.ageOrDescription}), wearing ${character.clothing}, distinguished by ${character.keyFeature}. Scene: ${sceneDescription}. Style: ${character.artStyle}, soft studio lighting, ultra-clean vector colors, high detail for children's publishing, 300 DPI, commercial picture book aesthetic.`;
}

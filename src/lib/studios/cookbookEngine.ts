/**
 * Production Cookbook & Structured Recipe Engine
 * - Commercial recipe data schema (Ingredients, Steps, Nutrition, Prep/Cook time, Chef's Notes)
 * - Dual layout options (Luxury Single-Page Card vs 2-Column Spread)
 * - Pre-packaged gourmet recipe collections (Mediterranean, 30-Min Dinners, Keto, Plant-Based)
 * - Prepress 300 DPI vector PDF cookbook manuscript generator
 */

export interface IngredientItem {
  amount: string; // e.g. "2 tbsp", "1 1/2 cups", "400g"
  item: string;   // e.g. "Extra virgin olive oil", "Baby spinach"
  notes?: string; // e.g. "freshly squeezed", "finely chopped"
}

export interface RecipeNutrition {
  calories: number;
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
}

export interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  category: 'Breakfast' | 'Mains' | 'Soups & Salads' | 'Desserts' | 'Snacks';
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'Easy' | 'Moderate' | 'Gourmet';
  nutrition: RecipeNutrition;
  ingredients: IngredientItem[];
  instructions: string[];
  chefTip: string;
}

export interface CookbookProject {
  id: string;
  bookTitle: string;
  authorName: string;
  theme: string;
  trimSize: '8.5x11' | '6x9';
  recipes: Recipe[];
}

export const SAMPLE_COOKBOOKS: CookbookProject[] = [
  {
    id: 'mediterranean-glow',
    bookTitle: 'The Mediterranean Weeknight Table',
    authorName: 'Chef Studio',
    theme: 'Fresh, Vibrant & Fast Mediterranean Cuisine',
    trimSize: '8.5x11',
    recipes: [
      {
        id: 'rec-1',
        title: 'Crispy Garlic Butter Tuscan Salmon',
        subtitle: 'Pan-seared salmon fillets in a rich sun-dried tomato and baby spinach cream sauce.',
        category: 'Mains',
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 4,
        difficulty: 'Easy',
        nutrition: { calories: 460, protein: 38, carbs: 6, fat: 32 },
        ingredients: [
          { amount: '4 fillets (6 oz each)', item: 'Wild-caught salmon', notes: 'skin on, patted dry' },
          { amount: '2 tbsp', item: 'Extra virgin olive oil' },
          { amount: '3 tbsp', item: 'Unsalted butter' },
          { amount: '5 cloves', item: 'Garlic', notes: 'minced' },
          { amount: '1/2 cup', item: 'Sun-dried tomatoes', notes: 'drained and sliced' },
          { amount: '3 cups', item: 'Fresh baby spinach' },
          { amount: '1/2 cup', item: 'Heavy cream or full-fat coconut milk' },
          { amount: '1/3 cup', item: 'Grated Parmesan cheese' },
          { amount: '1 tbsp', item: 'Fresh lemon juice' },
          { amount: 'To taste', item: 'Sea salt and cracked black pepper' }
        ],
        instructions: [
          'Season the salmon fillets generously with sea salt and cracked black pepper on both sides.',
          'Heat olive oil in a large heavy skillet over medium-high heat. Add salmon skin-side up and sear undisturbed for 5 minutes until golden crisp. Flip and cook 3 more minutes. Transfer to a warm plate.',
          'In the same skillet, melt butter over medium heat. Sauté minced garlic and sun-dried tomatoes for 1 minute until fragrant.',
          'Pour in the cream, bring to a gentle simmer, then stir in the Parmesan cheese until smooth and melted.',
          'Add fresh baby spinach and stir for 2 minutes until just wilted. Squeeze in lemon juice.',
          'Return salmon fillets to the skillet, spooning the velvety sauce over top. Garnish with fresh basil and serve immediately.'
        ],
        chefTip: 'For the crispiest skin, ensure the salmon is completely dry before searing and do not crowd the skillet.'
      },
      {
        id: 'rec-2',
        title: 'Greek Lemon Herb Chicken & Orzo',
        subtitle: 'One-pot tender chicken thighs baked with kalamata olives, feta, and fragrant lemon oregano broth.',
        category: 'Mains',
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 4,
        difficulty: 'Easy',
        nutrition: { calories: 510, protein: 42, carbs: 34, fat: 22 },
        ingredients: [
          { amount: '4', item: 'Bone-in, skin-on chicken thighs' },
          { amount: '1 1/2 cups', item: 'Dry orzo pasta' },
          { amount: '3 cups', item: 'Low-sodium chicken bone broth' },
          { amount: '1 medium', item: 'Yellow onion', notes: 'diced' },
          { amount: '1 cup', item: 'Cherry tomatoes', notes: 'halved' },
          { amount: '1/2 cup', item: 'Kalamata olives', notes: 'pitted and halved' },
          { amount: '1/2 cup', item: 'Greek feta cheese', notes: 'crumbled' },
          { amount: '1 large', item: 'Lemon', notes: 'juiced and zested' },
          { amount: '2 tsp', item: 'Dried Greek oregano' }
        ],
        instructions: [
          'Preheat oven to 375°F (190°C). Season chicken with oregano, lemon zest, salt, and pepper.',
          'Sear chicken in an oven-safe skillet until golden brown on both sides, about 4 minutes per side. Remove chicken.',
          'Sauté diced onion in the pan drippings for 3 minutes. Stir in dry orzo to lightly toast.',
          'Pour in chicken broth and lemon juice. Scatter cherry tomatoes and olives across the orzo.',
          'Nestle chicken thighs back on top of the liquid. Transfer skillet to oven and bake uncovered for 25 minutes until orzo is tender.',
          'Sprinkle generously with crumbled feta cheese and fresh oregano before serving directly from the skillet.'
        ],
        chefTip: 'Toasting the orzo in the pan drippings before adding broth builds an incredible nutty depth of flavor.'
      }
    ]
  }
];

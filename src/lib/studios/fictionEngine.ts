/**
 * Fiction & Novel Beat Sheet Engine
 * - 3-Act Structure & 15-Beat Save the Cat Story Architecture
 * - Character Arc & Conflict Matrix (Flaw, Want, Need, Ghost Wound)
 * - Scene-by-scene storyboard planner with pacing timeline
 * - 300 DPI Story Bible & Novel Outline PDF Exporter
 */

export interface CharacterArc {
  name: string;
  role: 'Protagonist' | 'Antagonist' | 'Deuteragonist' | 'Mentor' | 'Love Interest';
  internalFlaw: string;      // The Lie they believe about themselves/world
  externalWant: string;      // Tangible plot goal (e.g. Find the stolen cipher)
  soulNeed: string;          // Spiritual/emotional truth to overcome flaw
  backstoryGhost: string;    // Past traumatic event/wound driving their fear
}

export interface StoryBeat {
  beatNumber: number;
  beatName: string;
  act: 'Act I (Beginning)' | 'Act II (Middle)' | 'Act III (Resolution)';
  targetPercentage: string;  // e.g. "0-10%", "50%", "75%"
  description: string;
  sceneSummary: string;
  keyCharacters: string[];
}

export interface FictionProject {
  id: string;
  title: string;
  logline: string;
  genre: 'Thriller / Mystery' | 'Fantasy / Sci-Fi' | 'Romance' | 'Horror / Suspense';
  authorName: string;
  trimSize: '6x9' | '5.5x8.5';
  characters: CharacterArc[];
  beats: StoryBeat[];
}

export const SAMPLE_FICTION_PROJECT: FictionProject = {
  id: 'shadow-cipher',
  title: 'Shadows of the Black Citadel',
  logline: 'When an exiled cryptographer uncovers a coded assassination plot inside the imperial archives, she must ally with her former captor before the kingdom falls into civil war.',
  genre: 'Thriller / Mystery',
  authorName: 'A.R. Blackwood',
  trimSize: '6x9',
  characters: [
    {
      name: 'Kaelen Voss',
      role: 'Protagonist',
      internalFlaw: 'Believes she can only survive by staying invisible and never trusting anyone.',
      externalWant: 'Decode the celestial ledger and purchase her freedom from exile.',
      soulNeed: 'Learn that true power comes from vulnerability and shared courage.',
      backstoryGhost: 'Her former mentor betrayed her family to secure an imperial appointment.'
    },
    {
      name: 'Commander Robert Thorne',
      role: 'Love Interest',
      internalFlaw: 'Blindly obeys imperial protocol to atone for past battlefield failures.',
      externalWant: 'Maintain public order and arrest the leader of the Obsidian Syndicate.',
      soulNeed: 'Recognize that justice requires questioning corrupt authority.',
      backstoryGhost: 'Lost his squad in an ambush caused by corrupt high-command intelligence.'
    }
  ],
  beats: [
    {
      beatNumber: 1,
      beatName: '1. Opening Image',
      act: 'Act I (Beginning)',
      targetPercentage: '0–1%',
      description: 'A snapshot visual of the protagonist\'s flawed world before change.',
      sceneSummary: 'Kaelen works in the dusty subterranean archives of Oakhaven, painstakingly transcribing forbidden texts in complete isolation.',
      keyCharacters: ['Kaelen Voss']
    },
    {
      beatNumber: 2,
      beatName: '2. Theme Stated',
      act: 'Act I (Beginning)',
      targetPercentage: '5%',
      description: 'Someone states the core life lesson the protagonist must learn.',
      sceneSummary: 'An old archivist remarks to Kaelen: "A sealed letter protects its words, but it also stays trapped in the dark forever."',
      keyCharacters: ['Kaelen Voss']
    },
    {
      beatNumber: 3,
      beatName: '3. Catalyst (Inciting Incident)',
      act: 'Act I (Beginning)',
      targetPercentage: '10–12%',
      description: 'The life-altering event that disrupts the status quo.',
      sceneSummary: 'An assassin enters the archive, drops a bloodstained cylinder containing an unbreakable cipher, and collapses at Kaelen\'s feet.',
      keyCharacters: ['Kaelen Voss']
    },
    {
      beatNumber: 4,
      beatName: '4. Break into Act Two',
      act: 'Act II (Middle)',
      targetPercentage: '20–25%',
      description: 'The hero chooses to enter the new, unfamiliar world.',
      sceneSummary: 'Commander Thorne arrives to arrest Kaelen, but she demonstrates that only she can decipher the death threats against the capital.',
      keyCharacters: ['Kaelen Voss', 'Commander Robert Thorne']
    },
    {
      beatNumber: 5,
      beatName: '5. Midpoint',
      act: 'Act II (Middle)',
      targetPercentage: '50%',
      description: 'A false victory or false defeat raising the stakes dramatically.',
      sceneSummary: 'Kaelen and Thorne intercept the courier at the Grand Gala, only to discover the cipher points to the Archduke himself as the traitor.',
      keyCharacters: ['Kaelen Voss', 'Commander Robert Thorne']
    },
    {
      beatNumber: 6,
      beatName: '6. All is Lost',
      act: 'Act II (Middle)',
      targetPercentage: '75%',
      description: 'The lowest point where the old way of thinking completely fails.',
      sceneSummary: 'Thorne is captured and charged with treason. Kaelen\'s hiding spot is burned to the ground, leaving her with zero allies.',
      keyCharacters: ['Kaelen Voss']
    },
    {
      beatNumber: 7,
      beatName: '7. Finale & Climax',
      act: 'Act III (Resolution)',
      targetPercentage: '85–99%',
      description: 'The hero uses their new worldview to triumph over the main antagonist.',
      sceneSummary: 'Kaelen broadcasts the decoded ledger across the city spires, rallying the townspeople and rescuing Thorne at the coronation.',
      keyCharacters: ['Kaelen Voss', 'Commander Robert Thorne']
    },
    {
      beatNumber: 8,
      beatName: '8. Final Image',
      act: 'Act III (Resolution)',
      targetPercentage: '100%',
      description: 'The mirror image of Beat 1 showing how the protagonist has transformed.',
      sceneSummary: 'Kaelen stands in the open sunlight on the citadel balcony surrounded by friends, her days in the dark subterranean cellar behind her.',
      keyCharacters: ['Kaelen Voss']
    }
  ]
};

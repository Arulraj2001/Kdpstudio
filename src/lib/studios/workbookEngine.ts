/**
 * Interactive Workbook & Exercise Creator Engine
 * - Parametric exercise generators for commercial companion workbooks
 * - Supports Likert-Scale Self-Assessments, Fill-in Reflection Worksheets, Multiple Choice Quizzes, and Action Matrices
 * - Prepress 300 DPI vector PDF workbook manuscript generator
 */

export type ExerciseType = 'self-assessment' | 'reflection' | 'multiple-choice' | 'action-matrix';

export interface LikertQuestion {
  id: string;
  statement: string;
  category?: string;
}

export interface ReflectionPrompt {
  id: string;
  promptQuestion: string;
  subHint?: string;
  lineCount: number; // e.g. 4 or 6 lines
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface WorkbookSection {
  sectionNumber: number;
  title: string;
  learningObjective: string;
  assessments: LikertQuestion[];
  reflections: ReflectionPrompt[];
  quizzes: QuizQuestion[];
}

export interface WorkbookProject {
  id: string;
  title: string;
  subtitle: string;
  authorName: string;
  trimSize: '8.5x11' | '6x9';
  sections: WorkbookSection[];
}

export const SAMPLE_WORKBOOK_PROJECT: WorkbookProject = {
  id: 'mindset-workbook',
  title: 'The High-Performance Habit Workbook',
  subtitle: 'Practical Exercises, Self-Assessments, and Implementation Worksheets',
  authorName: 'Mindset Studio',
  trimSize: '8.5x11',
  sections: [
    {
      sectionNumber: 1,
      title: 'Auditing Your Current Time & Energy Leaks',
      learningObjective: 'Identify the hidden friction points draining 10+ hours per week of productive focus.',
      assessments: [
        { id: 'a1', statement: 'I start my workday with a pre-written Top 3 priority list rather than reacting to notifications.' },
        { id: 'a2', statement: 'I can maintain deep unbroken concentration for 60 minutes without checking social media.' },
        { id: 'a3', statement: 'I protect my highest-energy morning hours for needle-moving creative work.' },
        { id: 'a4', statement: 'I regularly say "no" to low-impact requests that do not align with my quarterly goals.' }
      ],
      reflections: [
        {
          id: 'r1',
          promptQuestion: 'What is the single biggest distraction that derailed your progress over the past 7 days?',
          subHint: 'Be specific about the emotional trigger (e.g. boredom, fatigue, anxiety).',
          lineCount: 4
        },
        {
          id: 'r2',
          promptQuestion: 'If you could only complete one task tomorrow to make the day an undeniable win, what would it be?',
          subHint: 'Focus on leverage: the task that makes everything else easier or unnecessary.',
          lineCount: 4
        }
      ],
      quizzes: [
        {
          id: 'q1',
          question: 'According to Parkinson\'s Law, what happens when you allocate 4 hours to complete a 1-hour task?',
          options: [
            'The work expands to fill the entire 4 hours allocated to its completion',
            'You finish in 1 hour and have 3 hours of extra rest',
            'The quality of the output increases proportionally',
            'The task becomes 4 times easier to execute'
          ],
          correctOptionIndex: 0,
          explanation: 'Parkinson\'s Law dictates that work expands to fill the exact timeframe allotted for its completion.'
        }
      ]
    }
  ]
};

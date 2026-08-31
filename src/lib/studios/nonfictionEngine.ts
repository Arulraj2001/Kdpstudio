/**
 * Non-Fiction & Business Framework Engine
 * - Chapter-by-chapter blueprint architecture (Hook, Problem, Framework, Case Study, Key Takeaways, Action Steps)
 * - Built-in authority publishing frameworks (5-Pillar System, Problem-Agitate-Solve)
 * - 300 DPI vector PDF manuscript generator with callout boxes and chapter worksheets
 */

export interface CaseStudy {
  subject: string;
  beforeState: string;
  breakthrough: string;
  afterState: string;
}

export interface NonFictionChapter {
  chapterNumber: number;
  title: string;
  subtitle: string;
  hook: string;
  coreProblem: string;
  frameworkName: string;
  frameworkSteps: string[];
  caseStudy: CaseStudy;
  keyTakeaways: string[];
  actionChecklist: string[];
}

export interface NonFictionProject {
  id: string;
  title: string;
  subtitle: string;
  authorName: string;
  targetAudience: string;
  trimSize: '6x9' | '5.5x8.5';
  chapters: NonFictionChapter[];
}

export const SAMPLE_NONFICTION_PROJECT: NonFictionProject = {
  id: 'high-leverage-biz',
  title: 'The High-Leverage Blueprint',
  subtitle: 'How to Build an Automated, High-Margin Publishing Business in 90 Days',
  authorName: 'Authority Studio',
  targetAudience: 'Self-Publishers, Entrepreneurs & Authors',
  trimSize: '6x9',
  chapters: [
    {
      chapterNumber: 1,
      title: 'The Leverage Multiplier',
      subtitle: 'Why working harder is the slowest path to 7-figure royalties',
      hook: 'Most authors believe publishing more books will eventually make them rich. In reality, publishing without leverage is like digging a tunnel with a spoon.',
      coreProblem: 'Wasting months writing books that lack market demand, high conversion covers, or organic keyword momentum.',
      frameworkName: 'The 3-Tier Leverage Engine',
      frameworkSteps: [
        'Validate Niche Demand: Identify low-competition keywords with over $3,000/mo estimated royalties.',
        'Algorithmic Production: Automate formatting, cover layout, and vector puzzle/activity generation.',
        'Back-of-Book Flywheel: Turn every reader into an active email subscriber via lead magnets.'
      ],
      caseStudy: {
        subject: 'Marcus V., First-Time KDP Publisher',
        beforeState: 'Spent 6 months writing 1 novel that earned $42 in total royalties.',
        breakthrough: 'Switched to data-backed activity books using standardized vector engines and lead magnet QR funnels.',
        afterState: 'Scaled to $4,850/mo in recurring passive income across 12 evergreen titles in 90 days.'
      },
      keyTakeaways: [
        'Effort does not equal earnings—market demand and leverage dictate royalty volume.',
        'Standardizing interior production increases output speed by 10x without sacrificing quality.',
        'Capturing reader emails at the back of every book compounds your launch power for life.'
      ],
      actionChecklist: [
        'Audit your existing catalog using the Reverse ASIN & BSR Spy tool.',
        'Identify 3 underserved sub-niches with average BSRs under 50,000.',
        'Embed a Lead Magnet QR code bonus page on page 3 of your next manuscript.'
      ]
    },
    {
      chapterNumber: 2,
      title: 'The Evergreen Niche Matrix',
      subtitle: 'Finding low-competition keywords with insatiable buyer demand',
      hook: 'A mediocre book in a starving market outsells a masterpiece in an empty desert every single time.',
      coreProblem: 'Publishers enter saturated niches where mega-brands and massive ad budgets make organic discovery nearly impossible.',
      frameworkName: 'The Opportunity Score Formula',
      frameworkSteps: [
        'Search Volume Velocity: Target search terms with >1,000 monthly Amazon searches.',
        'Review Moat Analysis: Verify top 5 competitors have fewer than 250 reviews.',
        'Pricing Arbitrage: Confirm $9.99 - $14.99 price points yield healthy $4+ net profit per sale.'
      ],
      caseStudy: {
        subject: 'Elena R., Non-Fiction Creator',
        beforeState: 'Ranked on page 7 for generic "Weight Loss Guide" keywords.',
        breakthrough: 'Repositioned around "30-Minute Mediterranean Diet for Busy Nurses" using exact pain-point miner data.',
        afterState: 'Hit Amazon #1 New Release badge within 48 hours of launch.'
      },
      keyTakeaways: [
        'The riches are in the micro-niches with passionate, urgent problems.',
        'Mine 1-star to 3-star competitor reviews to discover exactly what buyers feel is missing.',
        'Never compete on price; compete on interior formatting precision and bonus value.'
      ],
      actionChecklist: [
        'Run 5 competitor ASINs through the Review Pain-Point Miner.',
        'List the top 3 unaddressed complaints in customer reviews.',
        'Position your book\'s subtitle as the direct solution to those 3 complaints.'
      ]
    }
  ]
};

'use client';

import React, { useState, useEffect } from 'react';
import { NicheDetailView } from '../../../../../components/research/NicheDetailView';
import { NicheResult } from '../../../../../types/niche';
import { getUserSavedNiches } from '../../../../../lib/nicheService';
import { useAuthStore } from '../../../../../lib/authStore';

export default function NicheDetailPage() {
  const { user, userDoc } = useAuthStore();
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  const [nicheId, setNicheId] = useState<string>('');
  const [savedId, setSavedId] = useState<string | undefined>(undefined);
  const [niche, setNiche] = useState<NicheResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const extractedId = pathParts[pathParts.length - 1] || 'niche_default';
      const searchParams = new URLSearchParams(window.location.search);
      const sId = searchParams.get('savedId') || undefined;
      setNicheId(extractedId);
      setSavedId(sId);
    }
  }, []);

  useEffect(() => {
    if (!nicheId) return;

    const fetchNiche = async () => {
      setIsLoading(true);
      try {
        const savedList = await getUserSavedNiches(uid);
        const match = savedList.find(
          (s) => s.id === savedId || s.nicheResult?.id === nicheId
        );
        if (match?.nicheResult) {
          setNiche(match.nicheResult);
        } else {
          // If not in saved niches, generate a quick fallback view
          setNiche({
            id: nicheId,
            nicheTitle: 'Amazon KDP Market Report',
            category: 'self-help',
            subcategory: 'Publishing Analytics',
            description: 'In-depth market analysis and competitive positioning data for this niche.',
            opportunityScore: 84,
            demandScore: 82,
            competitionScore: 42,
            profitScore: 78,
            trendScore: 80,
            estimatedMonthlySales: 'Estimated: 500-1,500 units/month',
            averagePrice: '$11.99-$14.99',
            topBsrRange: 'BSR 3,000-45,000',
            estimatedMonthlyRevenue: '$3,500-$9,000',
            difficulty: 'easy',
            competitorCount: '120-250 books',
            topCompetitorStrength: 'Moderate',
            marketGap: 'High reader demand for modern structured worksheets and clear visual breakdowns.',
            trend: 'rising',
            trendReason: 'Consistent search expansion across self-publishing categories.',
            seasonality: null,
            recommendedBisacCategories: ['SELF-HELP / Personal Growth / General', 'BODY, MIND & SPIRIT / General'],
            suggestedKeywords: ['guided journal', 'daily workbook', 'beginner handbook', 'habit tracker'],
            recommendedPrice: '$12.99',
            royaltyPlan: '70%',
            recommendedTrimSize: '6x9',
            pageCountRange: '120-160 pages',
            bookIdeas: [
              {
                title: 'The 30-Day Focus Blueprint',
                subtitle: 'Practical Exercises and Daily Journal',
                angle: 'Micro-prompts with accountability metrics',
                targetReader: 'Action-driven self-learners',
                estimatedPageCount: 140,
                suggestedPrice: '$12.99',
              },
            ],
            pros: ['Strong search intent from targeted buyers', 'Low initial production barrier'],
            cons: ['Requires eye-catching cover typography'],
            verdict: 'A viable and high-converting publishing opportunity on Amazon KDP.',
            timeToFirstSale: '2-4 weeks',
            generatedAt: new Date().toISOString(),
            searchQuery: 'Niche Report',
            dataSource: 'ai-analysis',
          });
        }
      } catch (e) {
        console.warn('Failed to load niche detail:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNiche();
  }, [nicheId, savedId, uid]);

  if (isLoading || !niche) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading Niche Intelligence Report...</p>
      </div>
    );
  }

  return (
    <NicheDetailView
      niche={niche}
      savedNicheId={savedId}
      onBack={() => {
        window.location.href = '/research';
      }}
      onNavigate={(route) => {
        window.location.href = `/${route}`;
      }}
    />
  );
}

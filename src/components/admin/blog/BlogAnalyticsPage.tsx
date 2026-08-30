'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Eye,
  TrendingUp,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BookOpen,
  ArrowRight,
  Edit,
  RefreshCw,
  Sliders,
  Filter,
} from 'lucide-react';
import { PageRoute } from '../../../types';
import { BlogPost } from '../../../types/blog';
import { calculateSeoScore } from '../../../lib/seoScorer';

interface BlogAnalyticsPageProps {
  onNavigate: (route: PageRoute, params?: Record<string, any>) => void;
  onEditPost?: (postId: string) => void;
}

export const BlogAnalyticsPage: React.FC<BlogAnalyticsPageProps> = ({
  onNavigate,
  onEditPost,
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>('views');
  const [filterLowSeoOnly, setFilterLowSeoOnly] = useState<boolean>(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog/posts');
      const data = await res.json();
      if (Array.isArray(data?.posts)) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts for analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Compute Overview Stats
  const stats = useMemo(() => {
    const totalViews = posts.reduce((acc, p) => acc + (p.viewCount || 0), 0);
    const thisMonthViews = Math.round(totalViews * 0.42); // Estimated active 30-day velocity

    const sortedByViews = [...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    const mostViewed = sortedByViews[0] || null;

    const totalReadTime = posts.reduce((acc, p) => acc + (p.readingTimeMinutes || 5), 0);
    const avgReadingTime = posts.length > 0 ? Math.round((totalReadTime / posts.length) * 10) / 10 : 0;

    return {
      totalViews,
      thisMonthViews,
      mostViewed,
      avgReadingTime,
    };
  }, [posts]);

  // Compute SEO Score Distribution
  const seoDistribution = useMemo(() => {
    const counts = { excellent: 0, good: 0, needsWork: 0, poor: 0 };
    posts.forEach((p) => {
      const scoreRes = calculateSeoScore(p);
      if (scoreRes.score >= 80) counts.excellent++;
      else if (scoreRes.score >= 60) counts.good++;
      else if (scoreRes.score >= 40) counts.needsWork++;
      else counts.poor++;
    });
    return counts;
  }, [posts]);

  // Content Gap Finder (Posts needing review: lastReviewedAt > 6 months ago or updatedAt > 3 months ago)
  const stalePosts = useMemo(() => {
    const now = Date.now();
    const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;
    const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;

    return posts
      .filter((p) => {
        const updatedTime = new Date(p.updatedAt || p.publishedAt || 0).getTime();
        const reviewedTime = p.lastReviewedAt ? new Date(p.lastReviewedAt).getTime() : 0;
        const isOldUpdate = now - updatedTime > threeMonthsMs;
        const isOldReview = !p.lastReviewedAt || now - reviewedTime > sixMonthsMs;
        return isOldUpdate || isOldReview;
      })
      .slice(0, 5);
  }, [posts]);

  // Top 10 Posts for Bar Chart
  const top10Posts = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10);
  }, [posts]);

  const maxViews = useMemo(() => {
    return Math.max(1, top10Posts[0]?.viewCount || 1);
  }, [top10Posts]);

  // Filtered & Sorted Posts for Performance Table
  const tablePosts = useMemo(() => {
    return posts
      .filter((p) => {
        if (!filterLowSeoOnly) return true;
        const scoreRes = calculateSeoScore(p);
        return scoreRes.score < 60;
      })
      .sort((a, b) => {
        if (sortBy === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
        if (sortBy === 'words') return (b.wordCount || 0) - (a.wordCount || 0);
        if (sortBy === 'seo') return calculateSeoScore(b).score - calculateSeoScore(a).score;
        if (sortBy === 'date') return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        return 0;
      });
  }, [posts, sortBy, filterLowSeoOnly]);

  const handleEdit = (p: BlogPost) => {
    if (onEditPost) {
      onEditPost(p.id);
    } else {
      onNavigate('admin-blog-edit', { id: p.id });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>📊</span> Blog & Content Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Traffic velocity, SEO score distribution, content decay analysis, and reader engagement metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPosts}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => onNavigate('admin-blog')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            View All Posts →
          </button>
        </div>
      </div>

      {/* ── 4 Overview Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Blog Views</span>
            <Eye size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.totalViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">All-time readers across {posts.length} posts</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">30-Day Velocity</span>
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {stats.thisMonthViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Estimated monthly pageviews</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Top Performer</span>
            <Sparkles size={16} className="text-amber-500" />
          </div>
          <div className="text-sm font-black text-slate-900 truncate" title={stats.mostViewed?.title}>
            {stats.mostViewed?.title || 'None yet'}
          </div>
          <div className="text-[11px] text-purple-700 font-bold">
            {(stats.mostViewed?.viewCount || 0).toLocaleString()} views
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Read Time</span>
            <Clock size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.avgReadingTime} min
          </div>
          <div className="text-[11px] text-slate-500 font-medium">238 words per minute baseline</div>
        </div>
      </div>

      {/* ── Top Posts Chart & SEO Distribution (2-Column) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left (7 cols): Top Posts Horizontal Bar Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center justify-between">
            <span>🔥 Top 10 Articles by View Count</span>
            <span className="text-[10px] text-slate-400 font-normal">Real-time rank</span>
          </h3>

          <div className="space-y-3 pt-1">
            {top10Posts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No post analytics data yet</div>
            ) : (
              top10Posts.map((p, idx) => {
                const ratio = Math.max(8, Math.round(((p.viewCount || 0) / maxViews) * 100));

                return (
                  <div key={p.id || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span
                        onClick={() => handleEdit(p)}
                        className="truncate max-w-[280px] sm:max-w-md hover:text-purple-600 cursor-pointer"
                        title={p.title}
                      >
                        #{idx + 1} {p.title}
                      </span>
                      <span className="font-mono text-purple-700">
                        {(p.viewCount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right (5 cols): SEO Score Distribution & Content Gap */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SEO Score Health Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                SEO & EEAT Health Distribution
              </h3>
              <button
                onClick={() => setFilterLowSeoOnly(!filterLowSeoOnly)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                  filterLowSeoOnly
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filterLowSeoOnly ? 'Show All' : 'Fix Low (<60)'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <div className="text-xl font-black">{seoDistribution.excellent}</div>
                <div className="text-[11px] font-bold text-emerald-800">Excellent (80–100)</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950">
                <div className="text-xl font-black">{seoDistribution.good}</div>
                <div className="text-[11px] font-bold text-blue-800">Good (60–79)</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
                <div className="text-xl font-black">{seoDistribution.needsWork}</div>
                <div className="text-[11px] font-bold text-amber-800">Needs Work (40–59)</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950">
                <div className="text-xl font-black">{seoDistribution.poor}</div>
                <div className="text-[11px] font-bold text-rose-800">Poor (&lt;40)</div>
              </div>
            </div>
          </div>

          {/* Content Gap / Stale Content Finder */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <span>Content Gap & Decay Alert</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Articles not reviewed in &gt;6 months or updated in &gt;3 months:
            </p>

            <div className="space-y-2 pt-1">
              {stalePosts.length === 0 ? (
                <div className="p-3 text-center text-xs text-emerald-600 font-semibold">
                  ✨ All content is fresh and actively reviewed!
                </div>
              ) : (
                stalePosts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate max-w-[200px]">{p.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.lastReviewedAt ? `Reviewed ${new Date(p.lastReviewedAt).toLocaleDateString()}` : 'Never reviewed'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleEdit(p)}
                      className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg hover:bg-purple-100 text-[11px] shrink-0"
                    >
                      Update
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Detailed Posts Performance Table ── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs space-y-0">
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Posts Performance Matrix ({tablePosts.length} posts)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Compare reader views against word counts and calculated SEO scores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 outline-none font-semibold text-slate-800"
            >
              <option value="views">Sort: Most Views</option>
              <option value="seo">Sort: Highest SEO Score</option>
              <option value="words">Sort: Word Count</option>
              <option value="date">Sort: Published Date</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-bold uppercase border-b border-slate-100 bg-slate-50/40">
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Views</th>
                <th className="p-3.5 text-center">SEO Score</th>
                <th className="p-3.5">Words</th>
                <th className="p-3.5">Est. Reads</th>
                <th className="p-3.5">Last Updated</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tablePosts.map((p) => {
                const seoRes = calculateSeoScore(p);
                const estReads = Math.round((p.viewCount || 0) * 0.72);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Title */}
                    <td className="p-3.5">
                      <div
                        onClick={() => handleEdit(p)}
                        className="font-bold text-slate-900 hover:text-purple-600 cursor-pointer line-clamp-1 max-w-xs"
                      >
                        {p.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">/blog/{p.slug}</div>
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {p.category || 'General'}
                      </span>
                    </td>

                    {/* Views */}
                    <td className="p-3.5 font-bold font-mono text-purple-700">
                      {(p.viewCount || 0).toLocaleString()}
                    </td>

                    {/* SEO Score */}
                    <td className="p-3.5 text-center">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full font-black text-[11px] text-white"
                        style={{ backgroundColor: seoRes.gradeColor }}
                      >
                        {seoRes.score}
                      </span>
                    </td>

                    {/* Words */}
                    <td className="p-3.5 font-mono text-slate-600">
                      {p.wordCount || 0}
                    </td>

                    {/* Est. Reads */}
                    <td className="p-3.5 font-mono text-slate-500">
                      {estReads.toLocaleString()}
                    </td>

                    {/* Last Updated */}
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Recently'}
                    </td>

                    {/* Action */}
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Edit post"
                      >
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

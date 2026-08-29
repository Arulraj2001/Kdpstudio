'use client';

import React, { useState } from 'react';
import { BookOpen, Clock, ArrowRight, Sparkles, Send, CheckCircle2, Search, Filter } from 'lucide-react';
import { PageRoute } from '../../types';
import { SEOHead } from '../seo/SEOHead';
import { getAllBlogPosts, getAllCategories, BlogPost } from '../../lib/blog';

interface BlogPageViewProps {
  onNavigate?: (route: PageRoute) => void;
  onSelectPost?: (slug: string) => void;
}

export const BlogPageView: React.FC<BlogPageViewProps> = ({ onNavigate, onSelectPost }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const postsPerPage = 9;

  const allPosts = getAllBlogPosts();
  const categories = getAllCategories();
  const featuredPost = allPosts.find((p) => p.featured);

  // Filter posts
  const filteredPosts = allPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage) || 1;
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const handleOpenPost = (slug: string) => {
    if (onSelectPost) {
      onSelectPost(slug);
    } else {
      window.location.href = `/blog/${slug}`;
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'blog_footer' }),
      });
    } catch {
      // Graceful fallback
    }
    setIsSubscribed(true);
  };

  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <SEOHead
        title="Blog — KDP Publishing Tips & Strategies"
        description="Guides and strategies for Amazon KDP self-publishers. Niche research, formatting, cover design, pricing, and more."
        canonicalPath="/blog"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        
        {/* ── Hero Section ── */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-200">
            <Sparkles size={14} className="text-purple-600" />
            <span>KDP Publishing Resource Hub</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            KDP Publishing Blog
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Actionable strategies, margin calculators, and AI publishing playbooks for Amazon self-publishers.
          </p>

          {/* Search bar */}
          <div className="pt-2 max-w-md mx-auto relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search articles, keywords, niches..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-xs"
            />
          </div>
        </div>

        {/* ── Category Filter Pills ── */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Featured Post Card ── */}
        {featuredPost && selectedCategory === 'All' && !searchQuery && (
          <div 
            onClick={() => handleOpenPost(featuredPost.slug)}
            className="group cursor-pointer rounded-3xl bg-gradient-to-br from-[#0f0f1a] via-[#1a1638] to-[#121226] text-white p-8 sm:p-12 border border-purple-900/50 shadow-2xl relative overflow-hidden transition-all hover:border-purple-500/60"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative space-y-5 max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                  Featured
                </span>
                <span className="text-purple-300 text-xs font-semibold">
                  {featuredPost.category}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <Clock size={12} /> {featuredPost.readTime}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight group-hover:text-purple-200 transition-colors">
                {featuredPost.title}
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {featuredPost.description}
              </p>

              <div className="pt-3 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  By <strong className="text-white">{featuredPost.author}</strong> · {featuredPost.date}
                </div>
                <div className="inline-flex items-center gap-2 text-purple-400 group-hover:text-purple-300 font-bold text-sm">
                  <span>Read Article</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Posts Grid ── */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center justify-between">
            <span>Latest Articles ({filteredPosts.length})</span>
            {selectedCategory !== 'All' && (
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
                Category: {selectedCategory}
              </span>
            )}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedPosts.map((post) => (
              <article
                key={post.slug}
                onClick={() => handleOpenPost(post.slug)}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-purple-300 hover:shadow-xl transition-all duration-200 cursor-pointer group space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-100">
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {post.readTime}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 leading-snug group-hover:text-purple-600 transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {post.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{post.date}</span>
                  <span className="text-purple-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Read More →
                  </span>
                </div>
              </article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16 space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
              <BookOpen size={36} className="mx-auto text-slate-400" />
              <h3 className="font-bold text-slate-700">No articles found</h3>
              <p className="text-xs text-slate-500">Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

        {/* ── Newsletter CTA Box ── */}
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 relative overflow-hidden border border-slate-800">
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Want KDP publishing tips in your inbox?
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
              Join 10,000+ self-publishers receiving our weekly breakdown of trending niches and KDP marketing tactics.
            </p>
          </div>

          {isSubscribed ? (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-sm font-bold animate-pulse">
              <CheckCircle2 size={18} />
              <span>You're subscribed! Check your inbox for our latest niche report.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors cursor-pointer shrink-0"
              >
                Subscribe
              </button>
            </form>
          )}

          <p className="text-[11px] text-slate-500">
            No spam ever. Unsubscribe with 1 click anytime.
          </p>
        </div>

      </div>
    </div>
  );
};

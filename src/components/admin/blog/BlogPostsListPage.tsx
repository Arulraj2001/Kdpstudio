'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckSquare,
  Square,
  Edit,
  Eye,
  Copy,
  Archive,
  Download,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  User,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { BlogPost, BlogStatus } from '../../../types/blog';
import { PageRoute } from '../../../types';
import { calculateSeoScore } from '../../../lib/seoScorer';
import {
  getAllAdminPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../../../lib/blogService';

interface BlogPostsListPageProps {
  onNavigate: (route: PageRoute, params?: Record<string, any>) => void;
  onEditPost?: (postId: string) => void;
}

export const BlogPostsListPage: React.FC<BlogPostsListPageProps> = ({ onNavigate, onEditPost }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const livePosts = await getAllAdminPosts();
      if (Array.isArray(livePosts)) {
        setPosts(livePosts);
      }
    } catch (err) {
      console.error('Failed to fetch admin blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    const counts = { all: posts.length, draft: 0, review: 0, published: 0, archived: 0 };
    posts.forEach((p) => {
      if (p.status in counts) {
        counts[p.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [posts]);

  // Unique categories and authors
  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [posts]);

  const authors = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.authorName) set.add(p.authorName);
    });
    return Array.from(set);
  }, [posts]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        // Status tab filter
        if (activeStatusTab !== 'all' && post.status !== activeStatusTab) {
          return false;
        }
        // Category filter
        if (selectedCategory !== 'all' && post.category !== selectedCategory) {
          return false;
        }
        // Author filter
        if (selectedAuthor !== 'all' && post.authorName !== selectedAuthor) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = post.title?.toLowerCase().includes(q);
          const matchSlug = post.slug?.toLowerCase().includes(q);
          const matchKeyword = post.focusKeyword?.toLowerCase().includes(q);
          const matchTag = post.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchSlug && !matchKeyword && !matchTag) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'latest') {
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
        }
        if (sortBy === 'views') {
          return (b.viewCount || 0) - (a.viewCount || 0);
        }
        if (sortBy === 'title-asc') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'title-desc') {
          return (b.title || '').localeCompare(a.title || '');
        }
        return 0;
      });
  }, [posts, activeStatusTab, selectedCategory, selectedAuthor, searchQuery, sortBy]);

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map((p) => p.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Actions
  const handleEdit = (post: BlogPost) => {
    if (onEditPost) {
      onEditPost(post.id);
    } else {
      onNavigate('admin-blog-edit', { id: post.id });
    }
  };

  const handlePreview = (post: BlogPost) => {
    window.open(`/blog/${post.slug}?preview=true`, '_blank');
  };

  const handleDuplicate = async (post: BlogPost) => {
    try {
      const dupData = {
        ...post,
        title: `${post.title} (Copy)`,
        slug: `${post.slug}-copy`,
        status: 'draft' as BlogStatus,
        publishedAt: null,
      };
      const newId = await createBlogPost(dupData as any, 'admin@kdpstudio.io');
      if (newId) {
        showToast('✅ Post duplicated as draft');
        fetchPosts();
      }
    } catch {
      showToast('❌ Failed to duplicate post');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await deleteBlogPost(id);
      showToast('📦 Post archived');
      fetchPosts();
    } catch {
      showToast('❌ Failed to archive post');
    }
  };

  // Bulk Actions
  const handleBulkStatusChange = async (newStatus: BlogStatus) => {
    try {
      for (const id of Array.from(selectedIds)) {
        await updateBlogPost(id, { status: newStatus }, 'admin@kdpstudio.io');
      }
      showToast(`✅ Updated status for ${selectedIds.size} posts`);
      setSelectedIds(new Set());
      fetchPosts();
    } catch {
      showToast('❌ Error updating status');
    }
  };

  const handleBulkArchive = async () => {
    if (!confirm(`Archive ${selectedIds.size} selected posts?`)) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await deleteBlogPost(id);
      }
      showToast(`📦 ${selectedIds.size} posts archived`);
      setSelectedIds(new Set());
      fetchPosts();
    } catch {
      showToast('❌ Error archiving posts');
    }
  };

  const handleBulkExportJson = () => {
    const selectedPosts = posts.filter((p) => selectedIds.has(p.id));
    const jsonStr = JSON.stringify(selectedPosts, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kdp-blog-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`⬇️ Exported ${selectedPosts.length} posts as JSON`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>📝</span> Blog Posts & SEO CMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Database-driven articles with live EEAT scoring, Google AdSense controls, and schema markup
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPosts}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => onNavigate('admin-blog-new')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>New Post</span>
          </button>
        </div>
      </div>

      {/* ── Status Tab Pills ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 text-xs">
        {[
          { id: 'all', label: 'All', count: statusCounts.all },
          { id: 'published', label: 'Published', count: statusCounts.published, color: 'text-emerald-700' },
          { id: 'draft', label: 'Drafts', count: statusCounts.draft, color: 'text-slate-600' },
          { id: 'review', label: 'In Review', count: statusCounts.review, color: 'text-amber-700' },
          { id: 'archived', label: 'Archived', count: statusCounts.archived, color: 'text-rose-700' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveStatusTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeStatusTab === tab.id
                ? 'bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
              activeStatusTab === tab.id ? 'bg-purple-200/80 text-purple-900' : 'bg-slate-200/60 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Search Input */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, slug, keyword..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-slate-800"
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-800 font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Author Dropdown */}
        <div>
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-800 font-medium"
          >
            <option value="all">All Authors</option>
            {authors.map((auth) => (
              <option key={auth} value={auth}>
                {auth}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-800 font-medium"
          >
            <option value="latest">Sort: Latest Updated</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="views">Sort: Most Views</option>
            <option value="title-asc">Sort: A-Z</option>
            <option value="title-desc">Sort: Z-A</option>
          </select>
        </div>
      </div>

      {/* ── Bulk Actions Toolbar (when selected) ── */}
      {selectedIds.size > 0 && (
        <div className="bg-purple-900 text-white px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-purple-700 px-2.5 py-1 rounded-lg">
              {selectedIds.size} selected
            </span>
            <span className="text-xs text-purple-200">Perform bulk operation on selected posts:</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkStatusChange(e.target.value as BlogStatus);
              }}
              defaultValue=""
              className="px-2.5 py-1.5 rounded-lg bg-purple-800 border border-purple-600 text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="" disabled>Change Status...</option>
              <option value="published">Publish Selected</option>
              <option value="draft">Move to Draft</option>
              <option value="review">Mark for Review</option>
              <option value="archived">Archive Selected</option>
            </select>

            <button
              onClick={handleBulkExportJson}
              className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleBulkArchive}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Archive size={13} />
              <span>Archive</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Posts Data Table ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="p-3.5 w-10 text-center">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-purple-600">
                    {selectedIds.size > 0 && selectedIds.size === filteredPosts.length ? (
                      <CheckSquare size={16} className="text-purple-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="p-3.5 w-14">Cover</th>
                <th className="p-3.5 min-w-[220px]">Title & Slug</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Author</th>
                <th className="p-3.5">Focus Keyword</th>
                <th className="p-3.5 text-center">SEO Score</th>
                <th className="p-3.5">Words</th>
                <th className="p-3.5">Views</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading database articles...</span>
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No blog posts found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? 'Try adjusting your filters or search terms.' : 'Create your first post or run bulk import!'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const isSelected = selectedIds.has(post.id);
                  const seoResult = calculateSeoScore(post);

                  return (
                    <tr
                      key={post.id}
                      className={`hover:bg-purple-50/30 transition-colors ${
                        isSelected ? 'bg-purple-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelect(post.id)}
                          className="text-slate-400 hover:text-purple-600"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-purple-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      {/* Thumbnail */}
                      <td className="p-3.5">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {post.featuredImage?.url ? (
                            <img
                              src={post.featuredImage.url}
                              alt={post.featuredImage.alt || post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText size={16} className="text-slate-400" />
                          )}
                        </div>
                      </td>

                      {/* Title & Slug */}
                      <td className="p-3.5">
                        <div
                          onClick={() => handleEdit(post)}
                          className="font-bold text-slate-900 hover:text-purple-600 cursor-pointer line-clamp-1"
                          title={post.title}
                        >
                          {post.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                          /blog/{post.slug}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            post.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : post.status === 'review'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : post.status === 'archived'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {post.category || 'General'}
                        </span>
                      </td>

                      {/* Author */}
                      <td className="p-3.5 whitespace-nowrap font-medium text-slate-600">
                        {post.authorName || 'KDP Studio'}
                      </td>

                      {/* Focus Keyword */}
                      <td className="p-3.5 whitespace-nowrap">
                        {post.focusKeyword ? (
                          <span className="text-[11px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200/50">
                            {post.focusKeyword}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* SEO Score Circle */}
                      <td className="p-3.5 text-center">
                        <div className="relative group inline-block">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] text-white shadow-2xs cursor-help mx-auto transition-transform group-hover:scale-110"
                            style={{ backgroundColor: seoResult.gradeColor }}
                          >
                            {seoResult.score}
                          </div>

                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-56 p-2.5 bg-slate-900 text-white rounded-xl shadow-xl text-[11px] leading-snug pointer-events-none">
                            <div className="font-bold flex items-center justify-between border-b border-slate-700 pb-1 mb-1">
                              <span className="capitalize">{seoResult.grade} ({seoResult.score}/100)</span>
                            </div>
                            <div className="text-[10px] text-slate-300 space-y-1">
                              {seoResult.checks
                                .filter((c) => c.status !== 'pass')
                                .slice(0, 2)
                                .map((c) => (
                                  <div key={c.id} className="flex items-start gap-1 text-amber-300">
                                    <span>⚠️</span>
                                    <span>{c.hint}</span>
                                  </div>
                                ))}
                              {seoResult.checks.every((c) => c.status === 'pass') && (
                                <div className="text-emerald-400 font-semibold">✨ All SEO & EEAT checks passing!</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Word Count */}
                      <td className="p-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {post.wordCount || 0}
                      </td>

                      {/* Views */}
                      <td className="p-3.5 whitespace-nowrap font-bold text-slate-700">
                        {(post.viewCount || 0).toLocaleString()}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : 'Draft'}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(post)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Edit post"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handlePreview(post)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Preview post"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDuplicate(post)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Duplicate draft"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleArchive(post.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Archive post"
                          >
                            <Archive size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

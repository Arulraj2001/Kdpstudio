'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Globe,
  Linkedin,
  Twitter,
  RefreshCw,
  X,
  FileText,
  User,
  CheckCircle2,
} from 'lucide-react';
import { BlogAuthor } from '../../../types/blog';
import { PageRoute } from '../../../types';
import { getAllAuthors, createAuthor, updateAuthor } from '../../../lib/blogService';

interface BlogAuthorsPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const BlogAuthorsPage: React.FC<BlogAuthorsPageProps> = ({ onNavigate }) => {
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAuthor, setEditingAuthor] = useState<BlogAuthor | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Form State
  const [name, setName] = useState<string>('');
  const [credentials, setCredentials] = useState<string>('');
  const [shortBio, setShortBio] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [expertise, setExpertise] = useState<string[]>(['Amazon KDP', 'Self-Publishing']);
  const [expertiseInput, setExpertiseInput] = useState<string>('');
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [twitterUrl, setTwitterUrl] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [isVerifiedExpert, setIsVerifiedExpert] = useState<boolean>(true);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const data = await getAllAuthors();
      if (Array.isArray(data)) {
        setAuthors(data);
      }
    } catch (err) {
      console.error('Failed to fetch authors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingAuthor(null);
    setName('');
    setCredentials('KDP Publisher, 5+ years');
    setShortBio('Author & Publishing Strategist specializing in high-royalty KDP books.');
    setBio('Publishing expert with extensive experience launching fiction, non-fiction, and activity books on Amazon.');
    setPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
    setExpertise(['Amazon KDP', 'Self-Publishing', 'Book Formatting']);
    setLinkedinUrl('');
    setTwitterUrl('');
    setWebsiteUrl('');
    setIsVerifiedExpert(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (author: BlogAuthor) => {
    setEditingAuthor(author);
    setName(author.name || '');
    setCredentials(author.credentials || '');
    setShortBio(author.shortBio || '');
    setBio(author.bio || '');
    setPhotoUrl(author.photoUrl || '');
    setExpertise(author.expertise || []);
    setLinkedinUrl(author.linkedinUrl || '');
    setTwitterUrl(author.twitterUrl || '');
    setWebsiteUrl(author.websiteUrl || '');
    setIsVerifiedExpert(Boolean(author.isVerifiedExpert));
    setIsModalOpen(true);
  };

  const handleAddExpertise = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && expertiseInput.trim()) {
      e.preventDefault();
      const clean = expertiseInput.replace(',', '').trim();
      if (!expertise.includes(clean)) {
        setExpertise([...expertise, clean]);
      }
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (t: string) => {
    setExpertise(expertise.filter((item) => item !== t));
  };

  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('❌ Author full name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      credentials: credentials.trim(),
      shortBio: shortBio.trim(),
      bio: bio.trim(),
      photoUrl: photoUrl.trim() || null,
      expertise,
      linkedinUrl: linkedinUrl.trim(),
      twitterUrl: twitterUrl.trim(),
      websiteUrl: websiteUrl.trim(),
      isVerifiedExpert,
    };

    try {
      if (editingAuthor) {
        // Update via direct Firestore service
        await updateAuthor(editingAuthor.id, payload as any);
        showToast('✅ Author profile updated');
      } else {
        // Create via direct Firestore service
        await createAuthor(payload as any);
        showToast('🎉 Author created successfully');
      }
      setIsModalOpen(false);
      fetchAuthors();
    } catch (err: any) {
      showToast(`❌ Error: ${err.message || 'Failed to save author'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>👤</span> Author Profiles & EEAT Credentials
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage author bylines, credentials, and verified expert badges for Google EEAT compliance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAuthors}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh authors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>New Author</span>
          </button>
        </div>
      </div>

      {/* ── Authors Data Table ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="p-3.5 w-14">Photo</th>
                <th className="p-3.5">Name & Credentials</th>
                <th className="p-3.5">Expertise Tags</th>
                <th className="p-3.5">Verification</th>
                <th className="p-3.5 text-center">Total Posts</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading authors...</span>
                  </td>
                </tr>
              ) : authors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    <User size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No authors found</p>
                    <p className="text-xs text-slate-400 mt-1">Add your first author to assign to blog articles.</p>
                  </td>
                </tr>
              ) : (
                authors.map((author) => (
                  <tr key={author.id} className="hover:bg-purple-50/30 transition-colors">
                    {/* Photo */}
                    <td className="p-3.5">
                      <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {author.photoUrl ? (
                          <img src={author.photoUrl} alt={author.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-purple-600" />
                        )}
                      </div>
                    </td>

                    {/* Name & Credentials */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{author.name}</span>
                        {author.isVerifiedExpert && (
                          <ShieldCheck size={14} className="text-emerald-600 shrink-0" aria-label="Verified Expert" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{author.credentials || 'Contributing Author'}</div>
                    </td>

                    {/* Expertise */}
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(author.expertise || []).map((exp) => (
                          <span
                            key={exp}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold"
                          >
                            {exp}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Verification */}
                    <td className="p-3.5 whitespace-nowrap">
                      {author.isVerifiedExpert ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 size={11} />
                          <span>Verified Expert</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard</span>
                      )}
                    </td>

                    {/* Total Posts */}
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {author.totalPosts || 0}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(author)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                          title="Edit author"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Author Modal (Create / Edit) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-white rounded-2xl p-6 shadow-2xl space-y-4 my-8 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>👤</span>
                <span>{editingAuthor ? 'Edit Author Profile' : 'New Author Profile'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAuthor} className="space-y-3.5">
              {/* Photo Preview & URL */}
              <div className="flex items-center gap-3.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-14 h-14 rounded-full bg-purple-100 border-2 border-purple-300 overflow-hidden shrink-0 flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Author Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-purple-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-[11px] font-bold text-slate-700">Photo URL</label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 outline-none mt-0.5 font-mono"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-800">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none mt-1 font-semibold"
                />
              </div>

              {/* Credentials */}
              <div>
                <label className="text-xs font-bold text-slate-800">Credentials / Title</label>
                <input
                  type="text"
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  placeholder="e.g. KDP Publisher, 5+ years"
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none mt-1"
                />
              </div>

              {/* Short Bio (Byline) */}
              <div>
                <label className="text-xs font-bold text-slate-800">Short Bio (1 sentence for article byline)</label>
                <input
                  type="text"
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  placeholder="e.g. Sarah has published 40+ Amazon KDP books..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none mt-1"
                />
              </div>

              {/* Full Bio */}
              <div>
                <label className="text-xs font-bold text-slate-800">Full Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Full background and experience..."
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none mt-1"
                />
              </div>

              {/* Expertise Tags */}
              <div>
                <label className="text-xs font-bold text-slate-800">Expertise Areas</label>
                <div className="flex flex-wrap gap-1.5 mb-1.5 mt-1">
                  {expertise.map((exp) => (
                    <span
                      key={exp}
                      className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold flex items-center gap-1"
                    >
                      <span>{exp}</span>
                      <button type="button" onClick={() => handleRemoveExpertise(exp)} className="text-purple-400 hover:text-rose-600">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  onKeyDown={handleAddExpertise}
                  placeholder="Type expertise and press Enter..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none"
                />
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">LinkedIn URL</label>
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Twitter / X URL</label>
                  <input
                    type="text"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://x.com/..."
                    className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              {/* Verified Expert Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Verified Expert Badge</div>
                  <div className="text-[10px] text-slate-500">Google EEAT trust badge on articles</div>
                </div>
                <input
                  type="checkbox"
                  checked={isVerifiedExpert}
                  onChange={(e) => setIsVerifiedExpert(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingAuthor ? 'Update Author' : 'Save Author'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

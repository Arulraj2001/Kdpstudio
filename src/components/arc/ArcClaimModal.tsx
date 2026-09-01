import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Download,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Mail,
  Send,
} from 'lucide-react';
import { ArcCampaign, ArcClaim } from '../../types/arc';
import { claimArcCopy, submitVoluntaryReview } from '../../lib/arcService';

interface ArcClaimModalProps {
  campaign: ArcCampaign;
  user: any;
  onClose: () => void;
  onClaimSuccess?: (claim: ArcClaim) => void;
}

export const ArcClaimModal: React.FC<ArcClaimModalProps> = ({
  campaign,
  user,
  onClose,
  onClaimSuccess,
}) => {
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [screeningAnswer, setScreeningAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeClaim, setActiveClaim] = useState<ArcClaim | null>(null);

  // Review submission state
  const [reviewUrl, setReviewUrl] = useState('');
  const [reviewRating, setReviewRating] = useState<number | undefined>(undefined);
  const [feedback, setFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Copied disclaimer feedback
  const [copiedDisclaimer, setCopiedDisclaimer] = useState(false);

  const ftcDisclaimer =
    'I received an Advance Review Copy of this book from KDP Studio and am leaving this review voluntarily.';

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address to receive your copy.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const claim = await claimArcCopy(campaign, {
        uid: user?.uid || `reader-${Date.now()}`,
        email: email.trim(),
        name: name.trim() || email.split('@')[0],
        answer: screeningAnswer.trim() || undefined,
      });
      setActiveClaim(claim);
      if (onClaimSuccess) onClaimSuccess(claim);
    } catch (err: any) {
      setError(err.message || 'Failed to claim ARC copy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDisclaimer = () => {
    navigator.clipboard.writeText(ftcDisclaimer);
    setCopiedDisclaimer(true);
    setTimeout(() => setCopiedDisclaimer(false), 2500);
  };

  const handleSubmitReviewProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaim || !reviewUrl.trim()) return;

    setSubmittingReview(true);
    try {
      await submitVoluntaryReview(activeClaim.id, reviewUrl.trim(), reviewRating, feedback.trim() || undefined);
      setReviewSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review confirmation.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {activeClaim ? 'Your ARC Access is Ready' : 'Claim Advance Reader Copy'}
              </h3>
              <p className="text-xs text-slate-500">100% Free • Amazon & FTC Compliant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Book Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-12 h-16 rounded-md bg-gradient-to-br from-purple-800 to-indigo-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {campaign.coverUrl ? (
                <img
                  src={campaign.coverUrl}
                  alt={campaign.title}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                'ARC'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                {campaign.genre}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-1">
                {campaign.title}
              </h4>
              <p className="text-[11px] text-slate-500">By {campaign.authorName}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!activeClaim ? (
            /* Step 1: Claim Form */
            <form onSubmit={handleClaim} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Your Full Name or Pseudonym</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Miller"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Email Address <span className="text-purple-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                />
                <p className="text-[11px] text-slate-400">
                  We'll email you the direct download link and reading companion.
                </p>
              </div>

              {campaign.screeningQuestion && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Author's Reader Question:
                    <span className="block font-normal text-slate-500 mt-0.5 italic">
                      "{campaign.screeningQuestion}"
                    </span>
                  </label>
                  <input
                    type="text"
                    value={screeningAnswer}
                    onChange={(e) => setScreeningAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>
              )}

              {/* Compliance & Voluntary Agreement Notice */}
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-purple-950">
                  <ShieldCheck size={14} className="text-purple-600 shrink-0" />
                  <span>Amazon Customer Review Guidelines Compliance</span>
                </div>
                <p>
                  Reviews on Amazon are <strong>strictly voluntary</strong>. You are under no obligation to leave a review. If you choose to share your honest thoughts (positive, neutral, or critical), you must include the standard disclosure.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={15} />
                <span>{loading ? 'Processing Claim...' : 'Download Advance Reader Copy Now'}</span>
              </button>
            </form>
          ) : (
            /* Step 2: Download & Review Submission */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>ARC Successfully Claimed!</span>
                </div>
                <p>
                  Your advance copy has been reserved. You can download the files below or send them to your Kindle reader.
                </p>
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`#download-epub-${activeClaim.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Downloading ${campaign.title} (EPUB). Happy reading!`);
                  }}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-slate-800 transition-colors shadow-2xs"
                >
                  <Download size={14} className="text-purple-600" />
                  <span>Download EPUB (Kindle/Apple)</span>
                </a>
                <a
                  href={`#download-pdf-${activeClaim.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Downloading ${campaign.title} (Print Proof PDF).`);
                  }}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-slate-800 transition-colors shadow-2xs"
                >
                  <Download size={14} className="text-indigo-600" />
                  <span>Download PDF Proof</span>
                </a>
              </div>

              {/* FTC Disclaimer Copy Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-purple-600" />
                    Mandatory Amazon / FTC Disclosure
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyDisclaimer}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                  >
                    {copiedDisclaimer ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedDisclaimer ? 'Copied!' : 'Copy Disclosure'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700 leading-relaxed select-all">
                  "{ftcDisclaimer}"
                </div>
              </div>

              {/* Amazon Review Link & Voluntary Proof Form */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Finished Reading?</span>
                  {campaign.amazonUrl && (
                    <a
                      href={campaign.amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline"
                    >
                      <span>Open Book on Amazon</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {!reviewSubmitted ? (
                  <form onSubmit={handleSubmitReviewProof} className="space-y-3">
                    <input
                      type="url"
                      required
                      value={reviewUrl}
                      onChange={(e) => setReviewUrl(e.target.value)}
                      placeholder="Paste your Amazon review link (optional)"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                    />

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send size={13} />
                      <span>{submittingReview ? 'Recording...' : 'Submit Voluntary Review Link'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
                    <Check size={14} className="text-purple-600" />
                    <span>Review confirmed! Your reader reliability karma has increased.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

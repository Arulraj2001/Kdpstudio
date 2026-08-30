'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

interface SocialShareProps {
  postId?: string;
  url: string;
  title: string;
  excerpt?: string;
  tags?: string[];
  initialShareCount?: number;
}

export const SocialShare: React.FC<SocialShareProps> = ({
  postId,
  url,
  title,
  excerpt = '',
  tags = [],
  initialShareCount = 0,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [shareCount, setShareCount] = useState<number>(initialShareCount);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const hashtags = tags
    .slice(0, 3)
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .join(',');

  const trackShareClick = async (platform: string) => {
    if (postId) {
      try {
        fetch('/api/blog/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, platform }),
        }).catch(() => {});
      } catch {}
      setShareCount((prev) => prev + 1);
    }
  };

  const handleOpenWindow = (shareUrl: string, platform: string) => {
    trackShareClick(platform);
    if (typeof window !== 'undefined') {
      window.open(shareUrl, '_blank', 'width=600,height=450,scrollbars=yes,resizable=yes');
    }
  };

  const handleCopyLink = () => {
    trackShareClick('copy');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        trackShareClick('native');
        await (navigator as any).share({
          title,
          text: excerpt || title,
          url,
        });
      } catch {
        // user cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const shareLinks = {
    x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}${hashtags ? `&hashtags=${hashtags}` : ''}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%0A%0A${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  return (
    <>
      {/* ─────────────────────────────────────────
          DESKTOP: Sticky Left Column
         ───────────────────────────────────────── */}
      <aside
        aria-label="Share article"
        className="hidden lg:flex flex-col items-center gap-3 sticky top-36 z-30 select-none"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Share
        </span>

        {/* Twitter / X */}
        <button
          onClick={() => handleOpenWindow(shareLinks.x, 'x')}
          className="w-11 h-11 rounded-full bg-black text-white hover:bg-slate-800 transition-all flex items-center justify-center shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          title="Share on X"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>

        {/* WhatsApp (High priority) */}
        <button
          onClick={() => handleOpenWindow(shareLinks.whatsapp, 'whatsapp')}
          className="w-11 h-11 rounded-full bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all flex items-center justify-center shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          title="Share on WhatsApp"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.905 3.018.905 3.18 0 5.766-2.587 5.767-5.768 0-3.18-2.586-5.768-5.768-5.768zm3.38 8.163c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.03-.478-1.706-.704-2.802-2.433-2.886-2.545-.084-.112-.693-.923-.693-1.761 0-.838.438-1.25.594-1.422.156-.172.34-.215.454-.215.114 0 .228.002.328.007.106.005.248-.04.388.297.144.348.494 1.206.537 1.293.043.087.072.189.014.304-.058.116-.087.189-.173.29-.087.101-.183.226-.261.304-.087.087-.178.181-.077.355.101.174.449.741.964 1.2.662.59 1.22.773 1.394.86.174.087.276.073.378-.044.102-.116.438-.51.554-.684.116-.174.232-.145.39-.087s1.011.477 1.185.564c.174.087.29.13.333.203.043.073.043.424-.101.829z" />
          </svg>
        </button>

        {/* LinkedIn */}
        <button
          onClick={() => handleOpenWindow(shareLinks.linkedin, 'linkedin')}
          className="w-11 h-11 rounded-full bg-[#0A66C2] text-white hover:bg-[#095196] transition-all flex items-center justify-center shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          title="Share on LinkedIn"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
        </button>

        {/* Facebook */}
        <button
          onClick={() => handleOpenWindow(shareLinks.facebook, 'facebook')}
          className="w-11 h-11 rounded-full bg-[#1877F2] text-white hover:bg-[#1464cc] transition-all flex items-center justify-center shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          title="Share on Facebook"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
          </svg>
        </button>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className={`w-11 h-11 rounded-full border transition-all flex items-center justify-center shadow-md hover:scale-105 active:scale-95 cursor-pointer ${
            copied
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-purple-600'
          }`}
          title={copied ? 'Link Copied!' : 'Copy Article Link'}
        >
          {copied ? <Check size={17} /> : <Copy size={16} />}
        </button>

        {/* Share Count Indicator */}
        {shareCount > 0 && (
          <div className="text-center mt-1">
            <div className="text-xs font-black text-slate-700">{shareCount}</div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Shares</div>
          </div>
        )}
      </aside>

      {/* ─────────────────────────────────────────
          MOBILE: Fixed Bottom Floating Bar
         ───────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
          <Share2 size={15} className="text-purple-600" />
          <span>Share:</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Twitter / X */}
          <button
            onClick={() => handleOpenWindow(shareLinks.x, 'x')}
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center cursor-pointer shadow-xs active:scale-90"
            title="Share on X"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => handleOpenWindow(shareLinks.whatsapp, 'whatsapp')}
            className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center cursor-pointer shadow-xs active:scale-90"
            title="Share on WhatsApp"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.905 3.018.905 3.18 0 5.766-2.587 5.767-5.768 0-3.18-2.586-5.768-5.768-5.768zm3.38 8.163c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.03-.478-1.706-.704-2.802-2.433-2.886-2.545-.084-.112-.693-.923-.693-1.761 0-.838.438-1.25.594-1.422.156-.172.34-.215.454-.215.114 0 .228.002.328.007.106.005.248-.04.388.297.144.348.494 1.206.537 1.293.043.087.072.189.014.304-.058.116-.087.189-.173.29-.087.101-.183.226-.261.304-.087.087-.178.181-.077.355.101.174.449.741.964 1.2.662.59 1.22.773 1.394.86.174.087.276.073.378-.044.102-.116.438-.51.554-.684.116-.174.232-.145.39-.087s1.011.477 1.185.564c.174.087.29.13.333.203.043.073.043.424-.101.829z" />
            </svg>
          </button>

          {/* LinkedIn */}
          <button
            onClick={() => handleOpenWindow(shareLinks.linkedin, 'linkedin')}
            className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center cursor-pointer shadow-xs active:scale-90"
            title="Share on LinkedIn"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.69-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
          </button>

          {/* Native Share or Copy */}
          <button
            onClick={handleNativeShare}
            className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
          >
            {copied ? <Check size={12} /> : <Share2 size={12} />}
            <span>{copied ? 'Copied!' : 'More'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

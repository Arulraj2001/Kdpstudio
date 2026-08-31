import React from 'react';
import { PageRoute } from '../../types';
import { SEOHead } from '../seo/SEOHead';

interface TermsPageViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const TermsPageView: React.FC<TermsPageViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <SEOHead
        pageKey="terms"
        title="Terms of Service — KDP Studio"
        canonicalPath="/terms"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-10">
        
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: August 2026 · Effective Immediately
          </p>
        </div>

        <div className="space-y-8 text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-8">
          
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By creating an account, accessing, or using KDP Studio ("Service", "Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not access or use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Service Description</h2>
            <p>
              KDP Studio provides automated manuscript writing assistants, Amazon KDP interior PDF formatters, wrap-around cover generators, and metadata optimization tools. We provide the tools to assist self-publishers, but we do not publish books on your behalf or act as an Amazon affiliate.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. User Accounts & Security</h2>
            <p>
              You are responsible for safeguarding your login credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. Intellectual Property & Ownership</h2>
            <p>
              <strong>You retain 100% ownership</strong> of all manuscript text, generated interiors, cover art files, and exported materials created using KDP Studio. KDP Studio claims no royalties, ownership, or licensing rights over your books.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">5. Payment Terms & Refunds</h2>
            <p>
              Paid plans (Starter, Pro, Agency) are billed in advance on a recurring monthly or annual basis. You may cancel at any time from your Settings. We provide a 7-day refund guarantee from the initial date of purchase if you are unsatisfied with the tools.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">6. Prohibited Uses</h2>
            <p>
              You agree not to use the Service to generate defamatory, obscene, infringing, or illegal content. You must comply with all Amazon KDP content guidelines when uploading exported materials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">7. Limitation of Liability</h2>
            <p>
              KDP Studio is provided "as is" without warranty of any kind. Under no circumstances shall KDP Studio be liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">8. Governing Law & Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">9. Contact Information</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              For legal inquiries, copyright notices, or questions regarding these terms, please submit an inquiry through our{' '}
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) onNavigate('contact');
                  else window.dispatchEvent(new CustomEvent('open-contact-modal', { detail: { subject: 'General Support' } }));
                }}
                className="font-bold text-purple-600 hover:text-purple-700 underline cursor-pointer inline-flex items-center gap-1"
              >
                Contact &amp; Support Form →
              </button>
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};

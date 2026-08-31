import React from 'react';
import { PageRoute } from '../../types';
import { SEOHead } from '../seo/SEOHead';

interface PrivacyPageViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const PrivacyPageView: React.FC<PrivacyPageViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <SEOHead
        pageKey="privacy"
        title="Privacy Policy — KDP Studio"
        canonicalPath="/privacy"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-10">
        
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Privacy & Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500">
            Compliant with India DPDP Act 2023 & European Union GDPR · Last updated August 2026
          </p>
        </div>

        <div className="space-y-8 text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-8">
          
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, including your name, email address, author profile data, manuscript drafts, and billing preferences. We automatically detect approximate geographic country via IP headers to display local currency pricing.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. How We Use Information</h2>
            <p>
              Your data is strictly used to provide, maintain, and enhance the KDP Studio tools, format your books, calculate printing specifications, and process your subscription billing. We never sell your personal data or your manuscripts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Third-Party Service Providers</h2>
            <p>
              We partner with trusted infrastructure and payment processors:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Firebase (Google Cloud):</strong> Encrypted database authentication and user profile storage.</li>
              <li><strong>AI Model Inferencing:</strong> High-performance AI inferencing without using your private data to train public models.</li>
              <li><strong>Payment Processors (Stripe / UPI):</strong> PCI-DSS compliant payment processing. We never store credit card numbers directly.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. India DPDP Act (2023) Rights</h2>
            <p>
              In accordance with the Digital Personal Data Protection Act of India, Indian citizens have the right to request access, correction, erasure of their personal data, and grievance redressal through our designated Data Protection Officer.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">5. GDPR Rights for EU Residents</h2>
            <p>
              If you reside in the European Economic Area (EEA), you are entitled to the rights of data portability, restriction of processing, objection, and the right to lodge a complaint with a supervisory authority.
            </p>
          </section>

          <section id="cookies" className="space-y-2 scroll-mt-20">
            <h2 className="text-lg font-bold text-slate-900">6. Cookie Policy & Local Storage</h2>
            <p>
              We use necessary session cookies and browser LocalStorage solely to persist your authentication session, currency preferences, and manuscript drafts. We do not use intrusive third-party cross-site advertising trackers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">7. Data Retention & Deletion</h2>
            <p>
              You can export or permanently delete your account and all associated manuscripts at any time from your Settings page.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">8. Contact Us</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              If you have any questions regarding privacy, GDPR/DPDP data handling, or data deletion requests, please reach out directly via our{' '}
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

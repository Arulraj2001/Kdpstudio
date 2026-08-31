import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, HelpCircle, Phone, MapPin } from 'lucide-react';
import { PageRoute } from '../../types';
import { SEOHead } from '../seo/SEOHead';

interface ContactPageViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const ContactPageView: React.FC<ContactPageViewProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      setErrorMsg('Please enter your email and message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      setSubmitted(true);
    } catch {
      setErrorMsg('Network error. Please try submitting again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <SEOHead
        pageKey="contact"
        title="Contact — KDP Studio"
        description="Get in touch with the KDP Studio team. Support for billing, technical issues, and feature requests."
        canonicalPath="/contact"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Support & Inquiries
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Get in Touch
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Have questions about KDP publishing, custom enterprise plans, or need technical help? We're here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Contact Info Cards */}
          <div className="space-y-4 lg:col-span-1">
            <button 
              type="button"
              onClick={() => {
                setSubject('General Support');
                document.getElementById('contact-form-card')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full text-left p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-purple-50/40 hover:border-purple-300 transition-all space-y-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Mail size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Email Support</h3>
              <p className="text-xs text-slate-600">
                Direct inquiry response within 12-24 business hours.
              </p>
              <span className="text-xs font-bold text-purple-600 group-hover:text-purple-700 block">
                Open Support Form →
              </span>
            </button>

            <button 
              type="button"
              onClick={() => {
                setSubject('UPI Verification / Billing');
                document.getElementById('contact-form-card')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full text-left p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/40 hover:border-emerald-300 transition-all space-y-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquare size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Direct UPI Activation</h3>
              <p className="text-xs text-slate-600">
                Paid via UPI or Indian Net Banking? Submit your transaction reference for instant account activation.
              </p>
              <span className="text-xs font-bold text-emerald-600 group-hover:text-emerald-700 block">
                Verify UPI Transaction →
              </span>
            </button>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Headquarters</h3>
              <p className="text-xs text-slate-600">
                KDP Studio Technologies<br />
                Bengaluru & Chennai, India
              </p>
            </div>
          </div>

          {/* Form */}
          <div id="contact-form-card" className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs scroll-mt-24">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Message Received!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Thank you for reaching out. Our support team will review your message and reply to <strong>{email}</strong> shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-bold text-slate-900">Send us a Message</h3>
                
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Your Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Subject / Category</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium"
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Billing">Billing & Payment / UPI Confirmation</option>
                    <option value="Technical">Technical & KDP Formatting Help</option>
                    <option value="Feature Request">Feature Request / Custom Trim Size</option>
                    <option value="Enterprise">Agency & Collective Licensing</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Message *</label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help you with your manuscript or account..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

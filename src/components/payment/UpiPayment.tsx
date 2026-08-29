/**
 * UPI Direct Payment Component
 * Allows users in India to pay via QR code / UPI ID and submit their UTR transaction reference.
 * 
 * QR Code Generation format:
 * upi://pay?pa={UPI_ID}&pn={NAME}&am={AMOUNT}&cu=INR
 */

import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Upload, 
  HelpCircle, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { PlanName, BillingCycle } from '../../types/payment';
import { useAuthStore } from '../../lib/authStore';
import { auth } from '../../lib/firebase';

interface UpiPaymentProps {
  plan: PlanName;
  billingCycle: BillingCycle;
  amount: number; // in INR
  onSubmitted: () => void;
  onBack: () => void;
}

export const UpiPayment: React.FC<UpiPaymentProps> = ({
  plan,
  billingCycle,
  amount,
  onSubmitted,
  onBack,
}) => {
  const { user } = useAuthStore();

  // Screen states: 1 = Instructions & QR, 2 = UTR Submission, 3 = Confirmation
  const [screen, setScreen] = useState<1 | 2 | 3>(1);

  // Screen 1: Copy state
  const [copied, setCopied] = useState(false);

  // Screen 2: Form state
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [showUtrInfo, setShowUtrInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedTime, setSubmittedTime] = useState<string>('');

  const upiId = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_UPI_ID) || 'kdpstudio@upi';
  const upiDisplayName = (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_UPI_DISPLAY_NAME || process.env?.UPI_DISPLAY_NAME)) || 'KDP Studio';
  const qrCodeUrl = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_UPI_QR_CODE_URL : undefined;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Screenshot file size exceeds 5MB limit.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setErrorMsg('Please enter your 12-22 digit UTR / Transaction Reference number.');
      return;
    }

    // Alphanumeric validation, 12 to 22 characters
    const utrRegex = /^[a-zA-Z0-9]{12,22}$/;
    if (!utrRegex.test(cleanUtr)) {
      setErrorMsg('UTR must be between 12 and 22 alphanumeric characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const uid = user?.uid || auth.currentUser?.uid || 'guest_author';
      let idToken = '';
      if (auth.currentUser) {
        try {
          idToken = await auth.currentUser.getIdToken();
        } catch {}
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': uid,
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const payload = {
        uid,
        email: user?.email || auth.currentUser?.email || 'author@kdpstudio.app',
        name: user?.displayName || user?.name || 'Kindle Author',
        plan,
        billingCycle,
        amount,
        utrNumber: cleanUtr,
        screenshotUrl: screenshotPreview || null,
      };

      const res = await fetch('/api/payment/upi/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit UPI payment for verification');
      }

      const nowFormatted = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });
      setSubmittedTime(nowFormatted + ' IST');
      setScreen(3);
      onSubmitted();
    } catch (err: any) {
      console.error('[UpiPayment] Submit error:', err);
      setErrorMsg(err.message || 'Error submitting UTR reference.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full text-slate-900 font-sans">
      {/* ─────────────────────────────────────────
          SCREEN 1: Payment Instructions & QR
         ───────────────────────────────────────── */}
      {screen === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Pay via UPI
            </h3>
            <p className="text-xs text-slate-500">
              Complete your payment using any UPI app on your phone
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
            {/* Left column: QR Code */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3">
              <div className="w-full">
                <div className="text-xs font-bold text-slate-700 mb-2">
                  Scan QR Code
                </div>
                <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center relative overflow-hidden">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI Payment QR Code" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    /* Fallback styled QR representation */
                    <div className="w-full h-full border-2 border-dashed border-purple-300 rounded-lg bg-purple-50/50 flex flex-col items-center justify-center p-3 text-purple-900">
                      <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-sm mb-1.5 shadow-sm">
                        UPI
                      </div>
                      <span className="text-[11px] font-bold text-slate-800">Scan with UPI App</span>
                      <span className="text-[9px] text-purple-600 font-mono mt-0.5">₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full space-y-2">
                <div className="text-[11px] font-medium text-slate-500">
                  Scan with any supported UPI app:
                </div>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">GPay</span>
                  <span className="px-2 py-1 text-[10px] font-bold rounded bg-purple-100 text-purple-800">PhonePe</span>
                  <span className="px-2 py-1 text-[10px] font-bold rounded bg-sky-100 text-sky-800">Paytm</span>
                  <span className="px-2 py-1 text-[10px] font-bold rounded bg-orange-100 text-orange-800">BHIM</span>
                </div>
              </div>
            </div>

            {/* Right column: Manual UPI ID */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700">
                  Or Pay using UPI ID
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-500 font-medium">UPI VPA Address</div>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-2.5 shadow-xs">
                    <code className="text-xs font-bold text-purple-900 flex-1 truncate font-mono">
                      {upiId}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyUpiId}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs">
                  <div className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Account Name</div>
                  <div className="font-bold text-slate-800">{upiDisplayName}</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-3">
                Open Google Pay, PhonePe, Paytm or your bank app, select "Pay by UPI ID", and paste the address above.
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-2xl p-4 text-center space-y-1 shadow-md">
            <div className="text-xs font-medium text-purple-200">Total Amount to Pay</div>
            <div className="text-3xl font-black text-amber-300 tracking-tight">
              ₹{amount.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-purple-200 font-medium pt-1">
              ⚠️ Pay the exact amount shown. Different amounts delay manual verification.
            </p>
          </div>

          <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center font-medium">
            Note: UPI payment is for one billing cycle. You can renew next month or upgrade via card.
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="button"
              id="upi-proceed-to-utr"
              onClick={() => setScreen(2)}
              className="flex-1 py-3.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-sm shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>I've Made the Payment</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          SCREEN 2: Submit UTR Number Form
         ───────────────────────────────────────── */}
      {screen === 2 && (
        <form onSubmit={handleSubmitUtr} className="space-y-5 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Enter Payment Reference
            </h3>
            <p className="text-xs text-slate-500">
              Enter the UTR or transaction reference from your payment confirmation
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* What is UTR Expandable Info */}
          <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3 text-xs space-y-2">
            <button
              type="button"
              onClick={() => setShowUtrInfo(!showUtrInfo)}
              className="w-full flex items-center justify-between font-bold text-purple-900 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle size={14} className="text-purple-600" />
                <span>What is a UTR Number?</span>
              </span>
              <span className="text-[11px] text-purple-700 underline">
                {showUtrInfo ? 'Hide details' : 'How to find it'}
              </span>
            </button>

            {showUtrInfo && (
              <p className="text-[11px] text-purple-800 leading-relaxed pt-1 border-t border-purple-200/60">
                UTR (Unique Transaction Reference) is a 12-digit numeric reference generated by UPI/banks after a successful transfer. Look for <strong>"UPI Ref No"</strong>, <strong>"Transaction ID"</strong>, or <strong>"UTR"</strong> in your Google Pay, PhonePe, or Paytm receipt.
              </p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="utr-input" className="block text-xs font-bold text-slate-800 mb-1">
                UTR / Transaction Reference Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="utr-input"
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 426811234567"
                maxLength={22}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 text-sm font-mono tracking-wider font-bold text-slate-900 bg-white placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                12 to 22 alphanumeric characters from your bank receipt.
              </p>
            </div>

            {/* Optional Screenshot upload */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Payment Screenshot <span className="text-slate-400 font-normal">(Optional, speeds up verification)</span>
              </label>
              
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-3.5 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  id="screenshot-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {screenshotPreview ? (
                  <div className="flex items-center justify-center gap-3">
                    <img 
                      src={screenshotPreview} 
                      alt="Uploaded screenshot" 
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-xs"
                    />
                    <div className="text-left text-xs">
                      <div className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Screenshot attached
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {screenshotFile?.name || 'image.jpg'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Upload size={18} className="text-slate-400" />
                    <span className="text-xs font-medium text-purple-700">Click or drag screenshot here</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, or WEBP up to 5MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Plan and Amount Summary */}
            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-medium text-slate-700">
              <div>
                Plan: <span className="font-bold capitalize text-slate-900">{plan} ({billingCycle})</span>
              </div>
              <div>
                Amount: <span className="font-black text-purple-900">₹{amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setScreen(1)}
              disabled={isSubmitting}
              className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="submit"
              id="submit-utr-button"
              disabled={isSubmitting || !utrNumber.trim()}
              className="flex-1 py-3.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Verifying Reference...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Submit for Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────
          SCREEN 3: Confirmation / Pending Notice
         ───────────────────────────────────────── */}
      {screen === 3 && (
        <div className="text-center space-y-6 py-2 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">
              Payment Submitted! ✅
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Your payment is being verified by our finance team. This usually takes <strong>2-4 hours</strong> during business hours (9 AM - 6 PM IST).
            </p>
          </div>

          {/* Details summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Plan Requested</span>
              <span className="font-bold text-slate-900 capitalize">{plan} ({billingCycle})</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-black text-purple-900">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">UTR Reference</span>
              <span className="font-mono font-bold text-slate-900">{utrNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted At</span>
              <span className="text-slate-700">{submittedTime || 'Just now'}</span>
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-800 text-center font-medium">
            We will email confirmation to <strong>{user?.email || 'your account email'}</strong> once approved. You can continue using free studio tools in the meantime.
          </div>

          <button
            type="button"
            onClick={onSubmitted}
            className="w-full py-3.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

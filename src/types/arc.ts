/**
 * KDP Studio — ARC Reader Lounge & Cross-Promotion Type Definitions
 * 100% Amazon KDP & FTC Compliant
 */

export type ArcCampaignStatus = 'draft' | 'active' | 'completed' | 'paused';
export type ArcClaimStatus = 'requested' | 'approved' | 'downloaded' | 'reviewed' | 'declined' | 'expired';
export type NewsletterSwapStatus = 'pending' | 'accepted' | 'completed' | 'declined' | 'cancelled';

export interface ArcCampaign {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  bookId?: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  genre: string;
  blurb: string;
  pageCount?: number;
  format: 'epub' | 'pdf' | 'both';
  downloadUrl?: string;
  totalSlots: number;
  claimedSlots: number;
  reviewWindowDays: number;
  amazonAsin?: string;
  amazonUrl?: string;
  watermarkingEnabled: boolean;
  targetMarketplace: string; // e.g. 'US', 'UK', 'IN', etc.
  status: ArcCampaignStatus;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  screeningQuestion?: string;
  featured?: boolean;
}

export interface ArcClaim {
  id: string;
  campaignId: string;
  campaignTitle: string;
  authorId: string;
  readerId: string;
  readerName: string;
  readerEmail: string;
  status: ArcClaimStatus;
  claimedAt: string;
  approvedAt?: string;
  downloadedAt?: string;
  downloadCount: number;
  reminderCount: number;
  reviewUrl?: string;
  reviewDate?: string;
  reviewRating?: number; // Optional 1-5, never mandatory
  feedbackText?: string;
  screeningAnswer?: string;
}

export interface ReaderProfile {
  uid: string;
  email: string;
  displayName: string;
  genresInterested: string[];
  totalClaimed: number;
  totalReviewed: number;
  reliabilityScore: number; // 0-100% based on voluntary feedback rate
  badges: string[]; // e.g. 'Top ARC Reader', 'Speed Reader', 'Verified Reviewer'
  isBanned?: boolean;
  createdAt: string;
}

export interface NewsletterSwap {
  id: string;
  requesterAuthorId: string;
  requesterAuthorName: string;
  requesterBookTitle: string;
  requesterCoverUrl?: string;
  requesterAmazonUrl: string;
  requesterNewsletterSize: number;
  requesterGenre: string;
  targetDateForRequester: string; // When Requester will mention Recipient

  recipientAuthorId: string;
  recipientAuthorName: string;
  recipientBookTitle: string;
  recipientCoverUrl?: string;
  recipientAmazonUrl: string;
  recipientNewsletterSize: number;
  recipientGenre: string;
  targetDateForRecipient: string; // When Recipient will mention Requester

  status: NewsletterSwapStatus;
  requesterClicks: number;
  recipientClicks: number;
  trackingTokenA: string;
  trackingTokenB: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArcAdSlotConfig {
  enabled: boolean;
  provider: 'adsense' | 'custom_banner' | 'in_house_promo';
  client?: string;
  slotId?: string;
  bannerImageUrl?: string;
  bannerLinkUrl?: string;
  bannerTitle?: string;
}

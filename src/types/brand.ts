/**
 * Author Brand Kit Types
 * Phase 12A — KDP Studio
 */

export interface PenName {
  name: string;
  genre?: string;
  bio?: string;
  isDefault?: boolean;
}

export interface BrandKit {
  uid: string;

  // Author Identity
  authorName: string;
  penNames: PenName[];
  activePenName: string;
  authorBioShort: string;      // ~50 words
  authorBioMedium: string;     // ~100 words
  authorBioLong: string;       // ~200 words
  authorPhotoUrl: string | null;
  authorWebsite: string;
  authorEmail: string;

  // Brand Colors
  primaryColor: string;        // e.g. #7c3aed
  secondaryColor: string;      // e.g. #4f46e5
  accentColor: string;         // e.g. #f59e0b
  textColor: string;           // e.g. #0f172a
  backgroundColor: string;     // e.g. #ffffff

  // Typography (Google Font Names)
  headingFont: string;
  bodyFont: string;
  accentFont: string;

  // Logo & Imprint
  logoUrl: string | null;
  logoText: string;
  publisherName: string;

  // Default Book Settings
  defaultTrimSize: string;
  defaultPaperType: 'white' | 'cream';
  defaultLanguage: string;
  defaultGenre: string;
  autoApplyToNewBooks: boolean;

  // Copyright & Legal
  copyrightTemplate: string;
  disclaimer: string;

  // Social & Marketing
  amazonAuthorUrl: string;
  goodreadsUrl: string;
  instagramHandle: string;
  facebookPage: string;
  twitterHandle: string;
  youtubeChannelUrl: string;
  tiktokHandle: string;

  // Cover Defaults
  defaultCoverStyle: string;
  defaultCoverFont: string;
  defaultCoverPrimaryColor: string;
  defaultCoverPattern: string | null;

  createdAt: any;
  updatedAt: any;
}

export const DEFAULT_BRAND_KIT: Omit<BrandKit, 'uid'> = {
  authorName: '',
  penNames: [],
  activePenName: '',
  authorBioShort: '',
  authorBioMedium: '',
  authorBioLong: '',
  authorPhotoUrl: null,
  authorWebsite: '',
  authorEmail: '',

  primaryColor: '#7c3aed',
  secondaryColor: '#4f46e5',
  accentColor: '#f59e0b',
  textColor: '#0f172a',
  backgroundColor: '#ffffff',

  headingFont: 'Playfair Display',
  bodyFont: 'Inter',
  accentFont: 'Montserrat',

  logoUrl: null,
  logoText: '',
  publisherName: '',

  defaultTrimSize: '6x9',
  defaultPaperType: 'white',
  defaultLanguage: 'English',
  defaultGenre: 'Non-Fiction',
  autoApplyToNewBooks: true,

  copyrightTemplate: `Copyright © {year} {author}\n\nAll rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews.\n\nPublished by {publisher}\n{website}`,
  disclaimer: 'The information provided in this book is for educational and informational purposes only.',

  amazonAuthorUrl: '',
  goodreadsUrl: '',
  instagramHandle: '',
  facebookPage: '',
  twitterHandle: '',
  youtubeChannelUrl: '',
  tiktokHandle: '',

  defaultCoverStyle: 'Modern Minimal',
  defaultCoverFont: 'Playfair Display',
  defaultCoverPrimaryColor: '#7c3aed',
  defaultCoverPattern: null,

  createdAt: null,
  updatedAt: null,
};

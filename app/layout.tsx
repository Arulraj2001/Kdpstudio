import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app'
  ),

  title: {
    default: 'KDP Studio — AI-Powered Book Publishing Suite',
    template: '%s | KDP Studio'
  },

  description: 'Create, format and publish Amazon KDP books with AI. Write chapters, design covers, generate puzzles, and optimize metadata — all in one tool. Free plan available.',

  keywords: [
    'KDP publishing tool',
    'Amazon KDP software',
    'AI book writing',
    'book formatting software',
    'KDP cover design',
    'self publishing tool',
    'word search book generator',
    'coloring book generator',
    'KDP metadata optimizer',
    'book interior formatter',
    'Kindle Direct Publishing',
    'AI writing tool for books',
  ],

  authors: [{ name: 'KDP Studio' }],
  creator: 'KDP Studio',
  publisher: 'KDP Studio',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'KDP Studio',
    title: 'KDP Studio — AI-Powered Book Publishing',
    description: 'Create KDP-ready books with AI. Write, format, design, and publish — all in one tool.',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'KDP Studio Dashboard',
    }]
  },

  twitter: {
    card: 'summary_large_image',
    title: 'KDP Studio — AI Book Publishing Suite',
    description: 'Create KDP-ready books with AI.',
    images: ['/og-image.png'],
    creator: '@kdpstudio',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/og-image.png',
  },

  manifest: '/site.webmanifest',

  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
  },

  alternates: {
    types: {
      'application/rss+xml': [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app'}/feed.xml`,
          title: 'KDP Studio Blog RSS Feed',
        },
      ],
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://ipapi.co" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KDP Studio" />
      </head>
      <body className="bg-[#f8fafc] text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

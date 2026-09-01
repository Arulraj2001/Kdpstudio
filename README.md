# 📖 KDP Studio — AI-Powered Amazon KDP Publishing Platform

**KDP Studio** is an all-in-one SaaS platform engineered for independent authors and Kindle Direct Publishing (KDP) publishers. From manuscript writing and chapter generation to low-content puzzle book engines, automated 300 DPI cover generation, author brand kits, series management, and multi-gateway billing.

---

## 🚀 Key Features

### ✍️ 1. Manuscript Studio & AI Assistant
- Interactive chapter editor with real-time word counting and formatting.
- AI Chapter Outline & Prose expansion powered by Google Gemini.
- Front matter / back matter configuration (Title page, Copyright, Dedication, About the Author).
- Amazon KDP category picker and 7-keyword backend optimization.

### 🎨 2. 300 DPI Cover Builder
- Full wraparound cover generator (Front, Spine, Back) with exact KDP trim size and page-count spine width calculations.
- Fabric.js interactive canvas with layers, typography presets, barcodes, and shapes.
- Imagen AI cover illustration generation.
- 1-click **Author Brand Kit** & **Book Series Style** auto-applicators.

### 🧩 3. Low-Content Puzzle & Activity Book Engines
- **Word Search**: Dynamic themed word search generator with solution answer keys.
- **Word Fit (Criss-Cross)**: Intersecting crossword grid generator sorted by word length.
- **Coloring Books**: AI prompt enhancer + Imagen vector-style line art coloring pages.
- **Color by Number**: Gemini SVG region parser with numbered color keys.
- Instant 300 DPI print-ready interior PDF exports.

### 👑 4. Author Brand Kit
- Centralized author identity: pen names, multi-length bios (short, medium, long), headshots, and publisher logos.
- Color palette management with AI color generator and 8 curated genre presets.
- Dynamic Google Fonts library.
- Automated manuscript inheritance and copyright template variable interpolation.

### 📚 5. Book Series Manager
- Organize multi-volume book collections with visual timeline roadmaps.
- Progressive color progression across volumes computed in HSL space.
- Shared series-wide KDP keywords and volume badge auto-positioning.
- Comprehensive **Series Bible PDF** exporter.

### 💳 6. Global Multi-Gateway Monetization & Usage Limits
- **Stripe**: Global card checkout, monthly & annual recurring subscriptions, and lifetime access.
- **Buy Me a Coffee**: Universal fallback for exact plan amounts, lifetime upgrades, and bonus credit refills.
- **UPI QR**: Indian direct QR code verification flow (GPay, PhonePe, Paytm).
- IP Geolocation auto-detection with multi-currency pricing switch.
- Feature access middleware with daily/monthly token and generation quotas.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Fabric.js
- **State Management**: Zustand with persistent storage
- **Backend / Server**: Node.js, Express.js
- **AI Models**: Google Gemini 2.5 Flash / Pro, Google Imagen 3
- **Database & Auth**: Firebase Auth, Cloud Firestore, Firebase Storage
- **PDF Generation**: Puppeteer, PDFKit
- **Email**: Resend Transactional Email Engine

---

## 🏁 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Arulraj2001/Kdpstudio.git
cd Kdpstudio
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your `GEMINI_API_KEY`, Firebase project credentials, and payment gateway keys.

### 3. Run Locally
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

---

## 🧪 Verification & Testing
```bash
# Run TypeScript compilation check
npm run lint

# Run Phase 12 Master Verification Suite
npx tsx scratch/verify-phase-12.ts

# Production Build
npm run build
```

---

## 📄 License
Private & Proprietary. All rights reserved.

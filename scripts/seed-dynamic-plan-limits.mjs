import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { PLAN_LIMITS, FEATURE_ACCESS } from '../src/lib/planLimits.js';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyC3gnC1NdRYEHm4zR8Kfe0BJeGR_Ae1xLk',
  authDomain: 'kdpstudioaio-3bf53.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kdpstudioaio-3bf53',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'kdpstudioaio-3bf53.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '494698350011',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:494698350011:web:ad96b775d58d49a874309e',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedPlanLimits() {
  console.log('🚀 Seeding Dynamic Plan Limits & Quota Matrix to Firestore (appConfig/planLimits)...');

  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'System Seed Initializer',
    tiers: PLAN_LIMITS,
    featureAccess: FEATURE_ACCESS,
    growthPromo: {
      enabled: true,
      bannerText: '🎉 Special Creator Launch: Free tier upgraded with extra daily AI credits & puzzle generation!',
      extraAiGenerationsBonus: 5,
      extraBookProjectsBonus: 2,
    },
  };

  const docRef = doc(db, 'appConfig', 'planLimits');
  await setDoc(docRef, payload, { merge: true });

  console.log('✅ Successfully seeded dynamic plan limits to Firestore:');
  console.log(`   - Free Tier Daily AI Credits: ${PLAN_LIMITS.free.daily.aiGenerations}`);
  console.log(`   - Free Tier Daily Puzzles: ${PLAN_LIMITS.free.daily.puzzleGenerations}`);
  console.log(`   - Free Tier Book Projects Limit: ${PLAN_LIMITS.free.total.bookProjects}`);
  console.log(`   - Total Features in Access Matrix: ${Object.keys(FEATURE_ACCESS).length}`);
  
  process.exit(0);
}

seedPlanLimits().catch((err) => {
  console.error('❌ Failed to seed plan limits to Firestore:', err);
  process.exit(1);
});

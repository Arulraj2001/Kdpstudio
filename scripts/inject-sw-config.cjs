const fs = require('fs');
const path = require('path');

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyC3gnC1NdRYEHm4zR8Kfe0BJeGR_Ae1xLk',
  authDomain: 'kdpstudioaio-3bf53.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kdpstudioaio-3bf53',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'kdpstudioaio-3bf53.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '494698350011',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:494698350011:web:ad96b775d58d49a874309e',
};

const templatePath = path.join(__dirname, '../public/firebase-messaging-sw.template.js');
const template = fs.readFileSync(templatePath, 'utf8');

const output = template.replace(
  '/* FIREBASE_CONFIG */',
  JSON.stringify(config, null, 2)
);

const publicPath = path.join(__dirname, '../public/firebase-messaging-sw.js');
fs.writeFileSync(publicPath, output);
console.log('✓ Injected Firebase config into public/firebase-messaging-sw.js');

const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'firebase-messaging-sw.js'), output);
  console.log('✓ Copied firebase-messaging-sw.js to dist/');
}

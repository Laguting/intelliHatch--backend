const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, onValue, push } = require('firebase/database');

// Firebase configuration loaded from environment variables (.env)
const firebaseConfig = {
  apiKey:            process.env.FIREBASE_API_KEY,
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.FIREBASE_PROJECT_ID,
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.FIREBASE_APP_ID,
  measurementId:     process.env.FIREBASE_MEASUREMENT_ID,
  databaseURL:       process.env.FIREBASE_DATABASE_URL,
};

let app = null;
let database = null;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('[Firebase] Initialized for project:', process.env.FIREBASE_PROJECT_ID);
} catch (error) {
  console.warn('[Firebase] Initialization failed:', error.message);
  console.warn('[Firebase] Server will run without Firebase. Check your .env credentials.');
}

module.exports = { app, database, ref, set, get, onValue, push };

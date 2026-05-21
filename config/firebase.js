const admin = require('firebase-admin');
const path = require('path');

// Path to the downloaded service account key
const serviceAccountPath = path.join(__dirname, '../intellihatch-05es-firebase-adminsdk-fbsvc-676254b6e0.json');

let app = null;
let database = null;

try {
  const serviceAccount = require(serviceAccountPath);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  
  database = admin.database();
  console.log('[Firebase] Admin SDK Initialized for project:', process.env.FIREBASE_PROJECT_ID);
} catch (error) {
  console.warn('[Firebase] Initialization failed:', error.message);
  console.warn('[Firebase] Server will run without Firebase. Check your .env credentials and service account file.');
}

// Wrappers to match Firebase Client SDK syntax so we don't have to rewrite our services
const ref = (db, dbPath) => db.ref(dbPath);
const onValue = (reference, callback) => reference.on('value', (snapshot) => callback(snapshot));
const set = (reference, value) => reference.set(value);
const get = (reference) => reference.once('value');
const push = (reference, value) => reference.push(value);

module.exports = { app, database, ref, set, get, onValue, push };

require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(
  __dirname,
  '../intellihatch-05es-firebase-adminsdk-fbsvc-afb005c24a.json'
);

let app = null;
let firestore = null;

try {
  const serviceAccount = require(serviceAccountPath);

  // Initialize only once (guard against hot-reload double-init)
  if (!admin.apps.length) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    app = admin.app();
  }

  firestore = admin.firestore();

  console.log(
    '[Firebase] ✅ Firestore initialized for project:',
    serviceAccount.project_id
  );
} catch (error) {
  console.warn('[Firebase] ⚠️  Initialization failed:', error.message);
  console.warn(
    '[Firebase] Server will run without Firestore. Check your service account JSON.'
  );
}

module.exports = { app, firestore };

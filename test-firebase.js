/**
 * test-firebase.js
 *
 * Quick sanity-check: connects to Firestore and prints all top-level
 * collection contents so you can confirm data is flowing.
 *
 * Usage:
 *   node test-firebase.js
 */

require('dotenv').config();
const { firestore } = require('./config/firebase');

async function checkFirestore() {
  if (!firestore) {
    console.error('❌  Firestore not initialized. Check your service account JSON and .env file.');
    process.exit(1);
  }

  console.log('\n🔥  Firestore connection established. Reading known collections...\n');

  const collections = [
    { path: 'Intellihatch/Environment',     label: 'Latest Sensor Reading' },
    { path: 'Intellihatch/Manual Control',  label: 'Control States' },
    { path: 'incubator/cycle',              label: 'Incubation Cycle' },
    { path: 'components/statuses',          label: 'Component Statuses' },
    { path: 'Intellihatch/Hatch Detection',  label: 'Hatch Detection' },
  ];

  for (const { path, label } of collections) {
    try {
      const parts = path.split('/');
      const docRef = firestore.collection(parts[0]).doc(parts[1]);
      const snapshot = await docRef.get();

      console.log(`─── ${label} (${path}) ${'─'.repeat(Math.max(0, 45 - label.length - path.length))}`);
      if (snapshot.exists) {
        console.log(JSON.stringify(snapshot.data(), null, 2));
      } else {
        console.log('  (no document yet)');
      }
      console.log('');
    } catch (err) {
      console.error(`  ❌  Failed to read ${path}:`, err.message);
    }
  }

  process.exit(0);
}

checkFirestore();

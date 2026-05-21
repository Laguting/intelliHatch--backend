require('dotenv').config();
const { app, database, ref, get } = require('./config/firebase');

async function checkDb() {
  if (!database) {
    console.log('Firebase not initialized. Check .env');
    process.exit(1);
  }
  
  try {
    const dbRef = ref(database, '/');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      console.log('Database contents:', JSON.stringify(snapshot.val(), null, 2));
    } else {
      console.log('No data available');
    }
  } catch (e) {
    console.error('Error fetching data:', e);
  }
  process.exit(0);
}

checkDb();

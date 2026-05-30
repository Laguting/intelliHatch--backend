/**
 * simulate-hardware.js
 *
 * Simulates an IoT sensor device writing temperature + humidity data
 * to Firestore `sensors/latest`. The backend sensorService listens
 * to this document via onSnapshot and reacts in real-time.
 *
 * Usage:
 *   node simulate-hardware.js
 */

require('dotenv').config();
const { firestore } = require('./config/firebase');

if (!firestore) {
  console.error('[Hardware Sim] ❌ Firestore not initialized. Check your service account JSON and .env file.');
  process.exit(1);
}

let temp = 37.0;
let hum = 60.0;

console.log('');
console.log('  ╔════════════════════════════════════════╗');
console.log('  ║     IntelliHatch Hardware Simulator    ║');
console.log('  ╠════════════════════════════════════════╣');
console.log('  ║  Writing to Firestore: Intellihatch/En ║');
console.log('  ║  Interval: every 3 seconds             ║');
console.log('  ║  Press Ctrl+C to stop                  ║');
console.log('  ╚════════════════════════════════════════╝');
console.log('');

const latestDocRef = firestore.collection('Intellihatch').doc('Environment');

setInterval(async () => {
  // Random walk for smooth, realistic variations
  temp += (Math.random() - 0.5) * 0.4;
  hum  += (Math.random() - 0.5) * 2;

  // Clamp within reasonable incubation bounds
  temp = Math.max(35, Math.min(40, temp));
  hum  = Math.max(40, Math.min(80, hum));

  const reading = {
    Temperature: parseFloat(temp.toFixed(1)),
    Humidity:    parseFloat(hum.toFixed(1)),
    timestamp:   new Date().toISOString(),
  };

  try {
    await latestDocRef.set(reading);
    console.log(
      `[Hardware] ✅ Wrote → Temp: ${reading.Temperature}°C | Hum: ${reading.Humidity}% | ${reading.timestamp}`
    );
  } catch (err) {
    console.error('[Hardware] ❌ Write failed:', err.message);
  }
}, 3000);

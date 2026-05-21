require('dotenv').config();
const { database, ref, set } = require('./config/firebase');

if (!database) {
  console.error('Firebase not initialized. Check your .env file.');
  process.exit(1);
}

let temp = 37.0;
let hum = 60.0;

console.log('--- Hardware Simulator Started ---');
console.log('Pushing fake sensor data to Firebase every 3 seconds...');
console.log('Check your IntelliHatch website to see it update live!');
console.log('Press Ctrl+C to stop.');

setInterval(() => {
  // Random walk for smooth variations
  temp += (Math.random() - 0.5) * 0.4;
  hum += (Math.random() - 0.5) * 2;

  // Keep within reasonable bounds
  temp = Math.max(35, Math.min(40, temp));
  hum = Math.max(40, Math.min(80, hum));

  // Write to Firebase
  set(ref(database, 'Sensors/Temperature'), parseFloat(temp.toFixed(1)));
  set(ref(database, 'Sensors/Humidity'), parseFloat(hum.toFixed(1)));
  
  console.log(`[Hardware] Wrote -> Temp: ${temp.toFixed(1)}°C | Hum: ${hum.toFixed(1)}%`);
}, 3000);

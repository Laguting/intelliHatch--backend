const config = require('../config');
const { firestore } = require('../config/firebase');

// ─── Firestore Refs ──────────────────────────────────────────────────────────
// sensors/latest  → live snapshot from hardware
// sensors/latest/history → time-series log (subcollection)

const LATEST_DOC = () => firestore && firestore.collection('Intellihatch').doc('Environment');
const HISTORY_COL = () => firestore && firestore.collection('Intellihatch').doc('Environment').collection('history');

class SensorService {
  constructor() {
    this.history = [];
    this.latestReading = {
      temperature: 37.0,
      humidity: 60.0,
      timestamp: new Date().toISOString(),
    };
    this.listeners = [];
    this.isStreaming = false;
    this._unsubscribe = null;
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  /**
   * Called every time we receive a new reading (from Firestore onSnapshot).
   * Keeps in-memory state + history, and notifies registered listeners.
   */
  _handleReading(reading) {
    this.latestReading = reading;

    this.history.push(reading);
    if (this.history.length > config.sensor.historySize) {
      this.history.shift();
    }

    this.listeners.forEach((fn) => fn(reading));
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Register a callback that fires on every new sensor reading. */
  onReading(callback) {
    this.listeners.push(callback);
  }

  /**
   * Start listening to Firestore `sensors/latest` for live sensor data.
   * The hardware (or simulate-hardware.js) writes temperature + humidity there.
   */
  startStreaming() {
    if (this.isStreaming) return;
    this.isStreaming = true;

    if (!firestore) {
      console.warn('[SensorService] Firestore not configured. Sensors will not update.');
      return;
    }

    console.log('[SensorService] 🔥 Subscribing to Firestore sensors/latest...');

    this._unsubscribe = LATEST_DOC().onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) return;

        const data = snapshot.data();
        if (data == null) return;

        const temp = data.Temperature !== undefined ? data.Temperature : data.temperature;
        const hum = data.Humidity !== undefined ? data.Humidity : data.humidity;

        if (temp == null || hum == null) return;

        const reading = {
          temperature: parseFloat(temp),
          humidity: parseFloat(hum),
          timestamp: data.timestamp || data.Timestamp || new Date().toISOString(),
        };

        this._handleReading(reading);

        // Append to history subcollection (fire-and-forget)
        HISTORY_COL()
          .add(reading)
          .catch((e) => console.error('[SensorService] History write error:', e.message));
      },
      (error) => {
        console.error('[SensorService] Firestore snapshot error:', error.message);
      }
    );
  }

  /** Unsubscribe from Firestore listener. */
  stopStreaming() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    this.isStreaming = false;
    console.log('[SensorService] Streaming stopped');
  }

  /** Returns the most recent sensor reading. */
  getLatestReading() {
    return this.latestReading;
  }

  /** Returns the in-memory history buffer for graph rendering. */
  getHistory() {
    return [...this.history];
  }
}

module.exports = new SensorService();

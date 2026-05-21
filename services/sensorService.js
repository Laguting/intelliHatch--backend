const config = require('../config');
const { database, ref, onValue } = require('../config/firebase');

class SensorService {
  constructor() {
    this.history = [];
    this.latestReading = { temperature: 37.0, humidity: 60.0, timestamp: new Date().toISOString() };
    this.listeners = [];
    this.isStreaming = false;
    
    // Store current values so we can combine them into a single reading
    this.currentTemp = 37.0;
    this.currentHum = 60.0;
  }

  /**
   * Internal method to record the latest combined reading into history and notify listeners.
   */
  _recordReading() {
    const reading = {
      temperature: this.currentTemp,
      humidity: this.currentHum,
      timestamp: new Date().toISOString(),
    };
    
    this.latestReading = reading;

    this.history.push(reading);
    if (this.history.length > config.sensor.historySize) {
      this.history.shift();
    }

    // Notify all registered listeners (e.g. socket service)
    this.listeners.forEach((fn) => fn(reading));

    return reading;
  }

  /**
   * Register a callback that fires on every new reading.
   */
  onReading(callback) {
    this.listeners.push(callback);
  }

  /**
   * Start listening to Firebase for sensor data.
   */
  startStreaming() {
    if (this.isStreaming) return;
    this.isStreaming = true;

    if (!database) {
      console.warn('[SensorService] Firebase not configured. Sensors will not update.');
      return;
    }

    console.log('[SensorService] Connecting to Firebase for live sensor data...');

    const tempRef = ref(database, 'Sensors/Temperature');
    const humRef = ref(database, 'Sensors/Humidity');

    onValue(tempRef, (snapshot) => {
      const val = snapshot.val();
      if (val !== null) {
        this.currentTemp = parseFloat(val);
        this._recordReading();
      }
    });

    onValue(humRef, (snapshot) => {
      const val = snapshot.val();
      if (val !== null) {
        this.currentHum = parseFloat(val);
        this._recordReading();
      }
    });
  }

  /**
   * Stop listening (mostly a no-op when using Firebase onValue, or we'd unsubscribe).
   */
  stopStreaming() {
    this.isStreaming = false;
    console.log('[SensorService] Streaming stopped');
  }

  /**
   * Get the most recent sensor reading.
   */
  getLatestReading() {
    return this.latestReading;
  }

  /**
   * Get the full history buffer for graph rendering.
   */
  getHistory() {
    return [...this.history];
  }
}

// Export a singleton instance
module.exports = new SensorService();

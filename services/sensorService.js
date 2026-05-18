const config = require('../config');

class SensorService {
  constructor() {
    this.history = [];
    this.latestReading = null;
    this.intervalId = null;
    this.listeners = [];
  }

  /**
   * Generate a realistic sensor reading with smooth fluctuation.
   * Uses a random walk approach so values change gradually, not erratically.
   */
  _generateReading() {
    const { temperature, humidity } = config.sensor;
    const now = new Date();

    let temp, hum;

    if (this.latestReading) {
      // Random walk from the previous value for smooth graph lines
      const tempDelta = (Math.random() - 0.5) * 0.4;
      const humDelta = (Math.random() - 0.5) * 2;

      temp = this.latestReading.temperature + tempDelta;
      hum = this.latestReading.humidity + humDelta;

      // Pull toward ideal values to prevent drift
      temp += (temperature.ideal - temp) * 0.05;
      hum += (humidity.ideal - hum) * 0.05;
    } else {
      // Initial reading close to ideal
      temp = temperature.ideal + (Math.random() - 0.5) * temperature.variance;
      hum = humidity.ideal + (Math.random() - 0.5) * humidity.variance;
    }

    // Clamp to valid ranges
    temp = Math.max(temperature.min, Math.min(temperature.max, temp));
    hum = Math.max(humidity.min, Math.min(humidity.max, hum));

    return {
      temperature: parseFloat(temp.toFixed(1)),
      humidity: parseFloat(hum.toFixed(1)),
      timestamp: now.toISOString(),
    };
  }

  /**
   * Record a reading into history and notify listeners.
   */
  _recordReading() {
    const reading = this._generateReading();
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
   * Start generating readings at the configured interval.
   */
  startStreaming() {
    if (this.intervalId) return;

    // Generate an initial batch of history so graphs aren't empty on connect
    for (let i = 0; i < 10; i++) {
      this._recordReading();
    }

    this.intervalId = setInterval(() => {
      this._recordReading();
    }, config.sensor.intervalMs);

    console.log(`[SensorService] Streaming started (every ${config.sensor.intervalMs}ms)`);
  }

  /**
   * Stop generating readings.
   */
  stopStreaming() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[SensorService] Streaming stopped');
    }
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

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Sensor simulation settings
  sensor: {
    intervalMs: parseInt(process.env.SENSOR_INTERVAL_MS, 10) || 2000,
    historySize: 50, // Number of data points to keep for graph rendering
    temperature: {
      ideal: 37.5,       // °C — ideal incubation temperature
      variance: 0.5,     // ± fluctuation range
      min: 35.0,
      max: 40.0,
    },
    humidity: {
      ideal: 60,         // % — ideal incubation humidity
      variance: 5,       // ± fluctuation range
      min: 40,
      max: 80,
    },
  },

  // Incubation cycle settings
  incubation: {
    totalDays: 21,                        // Standard chicken egg incubation period
    dayIncrementIntervalMs: 60 * 1000,    // 1 minute = 1 day (for demo; change in production)
  },
};

const sensorService = require('../services/sensorService');

/**
 * GET /api/sensors
 * Returns the latest sensor reading.
 */
exports.getLatest = (req, res) => {
  const reading = sensorService.getLatestReading();

  if (!reading) {
    return res.status(503).json({
      success: false,
      message: 'Sensor data not yet available. Sensors may still be initializing.',
    });
  }

  res.json({ success: true, data: reading });
};

/**
 * GET /api/sensors/history
 * Returns the rolling history buffer for graph rendering.
 */
exports.getHistory = (req, res) => {
  const history = sensorService.getHistory();
  res.json({ success: true, count: history.length, data: history });
};

const incubatorService = require('../services/incubatorService');

/**
 * GET /api/incubator/status
 * Returns the current incubation cycle status.
 */
exports.getStatus = (req, res) => {
  const status = incubatorService.getStatus();
  res.json({ success: true, data: status });
};

/**
 * POST /api/incubator/start
 * Start the incubation cycle.
 */
exports.startCycle = (req, res) => {
  const result = incubatorService.startCycle();

  if (!result.success) {
    return res.status(409).json(result);
  }

  res.json(result);
};

/**
 * POST /api/incubator/stop
 * Stop the incubation cycle.
 */
exports.stopCycle = (req, res) => {
  const result = incubatorService.stopCycle();

  if (!result.success) {
    return res.status(409).json(result);
  }

  res.json(result);
};

/**
 * POST /api/incubator/reset
 * Reset the incubation cycle completely.
 */
exports.resetCycle = (req, res) => {
  const result = incubatorService.resetCycle();
  res.json(result);
};

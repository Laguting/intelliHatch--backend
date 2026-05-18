const hatchDetectionService = require('../services/hatchDetectionService');

/**
 * GET /api/hatch
 * Returns the current hatch detection status and count.
 */
exports.getStatus = (req, res) => {
  const status = hatchDetectionService.getDetectionStatus();
  res.json({ success: true, data: status });
};

/**
 * POST /api/hatch/activate
 * Activate hatch detection.
 */
exports.activate = (req, res) => {
  const result = hatchDetectionService.activateDetection();

  if (!result.success) {
    return res.status(409).json(result);
  }

  res.json(result);
};

/**
 * POST /api/hatch/reactivate
 * Re-activate hatch detection (reset and start again).
 */
exports.reactivate = (req, res) => {
  const result = hatchDetectionService.reactivateDetection();

  if (!result.success) {
    return res.status(409).json(result);
  }

  res.json(result);
};

/**
 * PUT /api/hatch/count
 * Manually update the detected hatch count.
 * Body: { "count": <number> }
 */
exports.updateCount = (req, res) => {
  const { count } = req.body;

  if (typeof count !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid field: count (must be a non-negative number)',
    });
  }

  const result = hatchDetectionService.updateDetectedCount(count);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
};

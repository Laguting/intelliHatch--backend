const controlService = require('../services/controlService');

/**
 * GET /api/controls
 * Returns the state of all manual controls and the egg turner position.
 */
exports.getAll = (req, res) => {
  const controls = controlService.getControls();
  res.json({ success: true, data: controls });
};

/**
 * POST /api/controls/toggle/:control
 * Toggle a specific control ON/OFF.
 */
exports.toggleControl = (req, res) => {
  const { control } = req.params;
  const result = controlService.toggleControl(control);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
};

/**
 * POST /api/controls/set/:control
 * Set a specific control to ON or OFF explicitly.
 * Body: { "state": true | false }
 */
exports.setControl = (req, res) => {
  const { control } = req.params;
  const { state } = req.body;

  if (typeof state === 'undefined') {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: state (true or false)',
    });
  }

  const result = controlService.setControl(control, state);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
};

/**
 * POST /api/controls/turner/:position
 * Set the egg turner position (left, center, right).
 */
exports.setTurnerPosition = (req, res) => {
  const { position } = req.params;
  const result = controlService.setTurnerPosition(position);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
};

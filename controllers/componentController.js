const componentService = require('../services/componentService');

/**
 * GET /api/components
 * Returns all component statuses.
 */
exports.getAll = (req, res) => {
  const statuses = componentService.getAllStatuses();
  res.json({ success: true, data: statuses });
};

/**
 * GET /api/components/:component
 * Returns a single component's status.
 */
exports.getOne = (req, res) => {
  const { component } = req.params;
  const result = componentService.getStatus(component);

  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({ success: true, data: result });
};

/**
 * PUT /api/components/:component
 * Update a component's status (WORKING or MALFUNCTION).
 * Body: { "status": "WORKING" | "MALFUNCTION" }
 */
exports.updateStatus = (req, res) => {
  const { component } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: status (WORKING or MALFUNCTION)',
    });
  }

  const result = componentService.setStatus(component, status);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
};

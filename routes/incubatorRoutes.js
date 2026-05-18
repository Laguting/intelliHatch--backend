const router = require('express').Router();
const incubatorController = require('../controllers/incubatorController');

router.get('/status',  incubatorController.getStatus);
router.post('/start',  incubatorController.startCycle);
router.post('/stop',   incubatorController.stopCycle);
router.post('/reset',  incubatorController.resetCycle);

module.exports = router;

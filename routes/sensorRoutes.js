const router = require('express').Router();
const sensorController = require('../controllers/sensorController');

router.get('/',        sensorController.getLatest);
router.get('/history', sensorController.getHistory);

module.exports = router;

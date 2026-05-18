const router = require('express').Router();
const hatchController = require('../controllers/hatchController');

router.get('/',              hatchController.getStatus);
router.post('/activate',     hatchController.activate);
router.post('/reactivate',   hatchController.reactivate);
router.put('/count',         hatchController.updateCount);

module.exports = router;

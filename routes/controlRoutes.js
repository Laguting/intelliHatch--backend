const router = require('express').Router();
const controlController = require('../controllers/controlController');

router.get('/',                     controlController.getAll);
router.post('/toggle/:control',     controlController.toggleControl);
router.post('/set/:control',        controlController.setControl);
router.post('/turner/:position',    controlController.setTurnerPosition);

module.exports = router;

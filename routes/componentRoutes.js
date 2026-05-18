const router = require('express').Router();
const componentController = require('../controllers/componentController');

router.get('/',             componentController.getAll);
router.get('/:component',   componentController.getOne);
router.put('/:component',   componentController.updateStatus);

module.exports = router;

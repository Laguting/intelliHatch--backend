const router = require('express').Router();

const sensorRoutes    = require('./sensorRoutes');
const incubatorRoutes = require('./incubatorRoutes');
const componentRoutes = require('./componentRoutes');
const controlRoutes   = require('./controlRoutes');
const hatchRoutes     = require('./hatchRoutes');

router.use('/sensors',    sensorRoutes);
router.use('/incubator',  incubatorRoutes);
router.use('/components', componentRoutes);
router.use('/controls',   controlRoutes);
router.use('/hatch',      hatchRoutes);

module.exports = router;

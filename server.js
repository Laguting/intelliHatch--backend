const http = require('http');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
// Firebase is initialized in config/firebase.js and consumed directly by each service
const socketService = require('./services/socketService');
const sensorService = require('./services/sensorService');

// ─── Express App ─────────────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use('/api', routes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'IntelliHatch Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err.message);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

// ─── HTTP + WebSocket Server ─────────────────────────────────────────────────

const server = http.createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

// Start sensor data streaming
sensorService.startStreaming();

// ─── Start Listening ─────────────────────────────────────────────────────────

server.listen(config.port, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║       IntelliHatch Backend Server v1.0.0        ║');
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log(`  ║  HTTP:      http://localhost:${config.port}              ║`);
  console.log(`  ║  WebSocket: ws://localhost:${config.port}                ║`);
  console.log(`  ║  Mode:      ${config.nodeEnv.padEnd(37)}║`);
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log('  REST API Endpoints:');
  console.log('  ─────────────────────────────────────────────');
  console.log('  GET    /api/sensors           Latest readings');
  console.log('  GET    /api/sensors/history    Graph data');
  console.log('  GET    /api/incubator/status   Cycle status');
  console.log('  POST   /api/incubator/start    Start cycle');
  console.log('  POST   /api/incubator/stop     Stop cycle');
  console.log('  GET    /api/components         Component statuses');
  console.log('  PUT    /api/components/:name   Update status');
  console.log('  GET    /api/controls           Control states');
  console.log('  POST   /api/controls/toggle/:n Toggle control');
  console.log('  POST   /api/controls/turner/:p Turner position');
  console.log('  GET    /api/hatch              Detection status');
  console.log('  POST   /api/hatch/reactivate   Re-activate');
  console.log('');
});

module.exports = app;

const { Server } = require('socket.io');
const config = require('../config');

const sensorService = require('./sensorService');
const incubatorService = require('./incubatorService');
const componentService = require('./componentService');
const controlService = require('./controlService');
const hatchDetectionService = require('./hatchDetectionService');

let io = null;

/**
 * Initialize Socket.IO on the given HTTP server.
 */
function initialize(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  // ─── Register service listeners for broadcasting ───────────────────

  // Stream sensor data to all clients
  sensorService.onReading((reading) => {
    io.emit('sensor:data', reading);
  });

  // Broadcast incubator status changes
  incubatorService.onStatusChange((status) => {
    io.emit('incubator:status', status);
  });

  // Broadcast component status changes
  componentService.onStatusChange((statuses) => {
    io.emit('component:status', statuses);
  });

  // Broadcast control updates
  controlService.onUpdate((eventType, data) => {
    io.emit(eventType, data);
  });

  // Broadcast hatch detection updates
  hatchDetectionService.onStatusChange((status) => {
    io.emit('hatch:status', status);
  });

  // ─── Handle individual client connections ──────────────────────────

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send current state snapshot on connect
    socket.emit('sensor:history', sensorService.getHistory());
    socket.emit('sensor:data', sensorService.getLatestReading());
    socket.emit('incubator:status', incubatorService.getStatus());
    socket.emit('component:status', componentService.getAllStatuses());
    socket.emit('control:updated', controlService.getControls());
    socket.emit('hatch:status', hatchDetectionService.getDetectionStatus());

    // ─── Client-initiated events ───────────────────────────────────

    // Toggle a manual control
    socket.on('control:toggle', (data) => {
      const { control } = data;
      const result = controlService.toggleControl(control);
      socket.emit('control:toggleResult', result);
    });

    // Set egg turner position
    socket.on('turner:position', (data) => {
      const { position } = data;
      const result = controlService.setTurnerPosition(position);
      socket.emit('turner:positionResult', result);
    });

    // Start incubation cycle
    socket.on('incubator:start', () => {
      const result = incubatorService.startCycle();
      socket.emit('incubator:startResult', result);
    });

    // Stop incubation cycle
    socket.on('incubator:stop', () => {
      const result = incubatorService.stopCycle();
      socket.emit('incubator:stopResult', result);
    });

    // Re-activate hatch detection
    socket.on('hatch:reactivate', () => {
      const result = hatchDetectionService.reactivateDetection();
      socket.emit('hatch:reactivateResult', result);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket] WebSocket server initialized');
  return io;
}

/**
 * Get the Socket.IO instance.
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initialize() first.');
  }
  return io;
}

module.exports = { initialize, getIO };

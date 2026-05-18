class HatchDetectionService {
  constructor() {
    this.detectedCount = 0;
    this.status = 'idle'; // idle | active | complete
    this.lastDetectionTime = null;
    this.listeners = [];
  }

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  _notifyListeners() {
    const status = this.getDetectionStatus();
    this.listeners.forEach((fn) => fn(status));
  }

  /**
   * Get current hatch detection status.
   */
  getDetectionStatus() {
    return {
      detectedCount: this.detectedCount,
      status: this.status,
      lastDetectionTime: this.lastDetectionTime,
    };
  }

  /**
   * Activate hatch detection (simulates starting the detection process).
   */
  activateDetection() {
    if (this.status === 'active') {
      return { success: false, message: 'Detection is already active' };
    }

    this.status = 'active';
    console.log('[HatchDetectionService] Detection activated');

    // Simulate detection completing after a random delay (5-15 seconds)
    const detectionDelay = 5000 + Math.random() * 10000;
    setTimeout(() => {
      if (this.status === 'active') {
        // Simulate detecting 0-5 hatched eggs
        this.detectedCount = Math.floor(Math.random() * 6);
        this.status = 'complete';
        this.lastDetectionTime = new Date().toISOString();
        console.log(`[HatchDetectionService] Detection complete: ${this.detectedCount} detected`);
        this._notifyListeners();
      }
    }, detectionDelay);

    this._notifyListeners();
    return { success: true, message: 'Detection activated', status: this.getDetectionStatus() };
  }

  /**
   * Re-activate hatch detection (reset and start again).
   */
  reactivateDetection() {
    this.status = 'idle';
    this.detectedCount = 0;
    console.log('[HatchDetectionService] Detection re-activated');

    // Immediately start a new detection cycle
    return this.activateDetection();
  }

  /**
   * Manually update the detected count (e.g. from hardware sensor).
   */
  updateDetectedCount(count) {
    if (typeof count !== 'number' || count < 0) {
      return { success: false, error: 'Count must be a non-negative number' };
    }

    this.detectedCount = count;
    this.lastDetectionTime = new Date().toISOString();
    this._notifyListeners();

    return { success: true, detectedCount: this.detectedCount };
  }
}

module.exports = new HatchDetectionService();

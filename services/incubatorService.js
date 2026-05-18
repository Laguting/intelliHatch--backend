const config = require('../config');

class IncubatorService {
  constructor() {
    this.isActive = false;
    this.dayCount = 0;
    this.startDate = null;
    this.dayTimerId = null;
    this.listeners = [];
  }

  /**
   * Register a callback that fires whenever status changes.
   */
  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  _notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach((fn) => fn(status));
  }

  /**
   * Start the 21-day incubation cycle.
   */
  startCycle() {
    if (this.isActive) {
      return { success: false, message: 'Cycle is already running' };
    }

    this.isActive = true;
    this.dayCount = 1;
    this.startDate = new Date().toISOString();

    // Increment day count on interval (1 min = 1 day in demo mode)
    this.dayTimerId = setInterval(() => {
      if (this.dayCount >= config.incubation.totalDays) {
        this.stopCycle();
        return;
      }
      this.dayCount++;
      console.log(`[IncubatorService] Day ${this.dayCount} of ${config.incubation.totalDays}`);
      this._notifyListeners();
    }, config.incubation.dayIncrementIntervalMs);

    console.log('[IncubatorService] Incubation cycle started');
    this._notifyListeners();

    return { success: true, message: 'Incubation cycle started', status: this.getStatus() };
  }

  /**
   * Stop the incubation cycle.
   */
  stopCycle() {
    if (!this.isActive) {
      return { success: false, message: 'No active cycle to stop' };
    }

    if (this.dayTimerId) {
      clearInterval(this.dayTimerId);
      this.dayTimerId = null;
    }

    this.isActive = false;
    console.log(`[IncubatorService] Incubation cycle stopped at day ${this.dayCount}`);
    this._notifyListeners();

    return { success: true, message: 'Incubation cycle stopped', status: this.getStatus() };
  }

  /**
   * Reset the cycle completely.
   */
  resetCycle() {
    this.stopCycle();
    this.dayCount = 0;
    this.startDate = null;
    this._notifyListeners();
    return { success: true, message: 'Cycle reset', status: this.getStatus() };
  }

  /**
   * Get full current status.
   */
  getStatus() {
    return {
      isActive: this.isActive,
      dayCount: this.dayCount,
      totalDays: config.incubation.totalDays,
      startDate: this.startDate,
      progress: this.isActive
        ? parseFloat(((this.dayCount / config.incubation.totalDays) * 100).toFixed(1))
        : 0,
    };
  }
}

module.exports = new IncubatorService();

const config = require('../config');
const { database, ref, onValue, set } = require('../config/firebase');

class IncubatorService {
  constructor() {
    this.isActive = false;
    this.dayCount = 0;
    this.startDate = null;
    this.listeners = [];

    if (database) {
      console.log('[IncubatorService] Connecting to Firebase for cycle data...');
      const startRef = ref(database, 'Incubator/StartTimestamp');
      
      onValue(startRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          this.isActive = true;
          this.startDate = new Date(val).toISOString();
          
          const msPassed = Date.now() - val;
          const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
          this.dayCount = Math.max(0, daysPassed);
          
          console.log(`[IncubatorService] Cycle active. Day ${this.dayCount} of ${config.incubation.totalDays}`);
        } else {
          this.isActive = false;
          this.dayCount = 0;
          this.startDate = null;
          console.log('[IncubatorService] Cycle inactive.');
        }
        this._notifyListeners();
      });

      // Periodically check if a day rolled over
      setInterval(() => {
        if (this.isActive && this.startDate) {
          const msPassed = Date.now() - new Date(this.startDate).getTime();
          const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
          if (daysPassed !== this.dayCount) {
             this.dayCount = daysPassed;
             this._notifyListeners();
          }
        }
      }, 60 * 60 * 1000); // Check hourly
    } else {
      console.warn('[IncubatorService] Firebase not available. Cycle will not work correctly.');
    }
  }

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  _notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach((fn) => fn(status));
  }

  startCycle() {
    if (this.isActive) {
      return { success: false, message: 'Cycle is already running' };
    }

    if (database) {
      set(ref(database, 'Incubator/StartTimestamp'), Date.now());
    }

    return { success: true, message: 'Incubation cycle started', status: this.getStatus() };
  }

  stopCycle() {
    if (!this.isActive) {
      return { success: false, message: 'No active cycle to stop' };
    }

    if (database) {
      set(ref(database, 'Incubator/StartTimestamp'), null);
    }

    return { success: true, message: 'Incubation cycle stopped', status: this.getStatus() };
  }

  resetCycle() {
    if (database) {
      set(ref(database, 'Incubator/StartTimestamp'), Date.now());
    }
    return { success: true, message: 'Cycle reset', status: this.getStatus() };
  }

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

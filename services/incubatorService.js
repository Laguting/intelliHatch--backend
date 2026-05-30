const config = require('../config');
const { firestore } = require('../config/firebase');

// ─── Firestore Ref ───────────────────────────────────────────────────────────
// incubator/cycle → { startTimestamp: number|null, isActive: boolean }

const CYCLE_DOC = () => firestore && firestore.collection('incubator').doc('cycle');

class IncubatorService {
  constructor() {
    this.isActive = false;
    this.dayCount = 0;
    this.startDate = null;
    this.listeners = [];
    this._unsubscribe = null;

    this._init();
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  _init() {
    if (!firestore) {
      console.warn('[IncubatorService] Firestore not available. Cycle will not persist.');
      return;
    }

    console.log('[IncubatorService] 🔥 Subscribing to Firestore incubator/cycle...');

    this._unsubscribe = CYCLE_DOC().onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) {
          this.isActive = false;
          this.dayCount = 0;
          this.startDate = null;
          console.log('[IncubatorService] No cycle document found. Cycle inactive.');
          this._notifyListeners();
          return;
        }

        const data = snapshot.data();
        const startTs = data.startTimestamp; // epoch ms or null

        if (startTs) {
          this.isActive = true;
          this.startDate = new Date(startTs).toISOString();
          const msPassed = Date.now() - startTs;
          this.dayCount = Math.max(0, Math.floor(msPassed / (1000 * 60 * 60 * 24)));
          console.log(
            `[IncubatorService] Cycle active. Day ${this.dayCount} of ${config.incubation.totalDays}`
          );
        } else {
          this.isActive = false;
          this.dayCount = 0;
          this.startDate = null;
          console.log('[IncubatorService] Cycle inactive.');
        }

        this._notifyListeners();
      },
      (error) => {
        console.error('[IncubatorService] Firestore snapshot error:', error.message);
      }
    );

    // Periodically re-compute day count without a new Firestore event
    setInterval(() => {
      if (this.isActive && this.startDate) {
        const msPassed = Date.now() - new Date(this.startDate).getTime();
        const daysPassed = Math.max(0, Math.floor(msPassed / (1000 * 60 * 60 * 24)));
        if (daysPassed !== this.dayCount) {
          this.dayCount = daysPassed;
          this._notifyListeners();
        }
      }
    }, 60 * 60 * 1000); // Hourly
  }

  _notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach((fn) => fn(status));
  }

  _persistCycle(startTimestamp) {
    if (!firestore) return;
    CYCLE_DOC()
      .set({ startTimestamp, isActive: startTimestamp !== null })
      .catch((e) => console.error('[IncubatorService] Firestore write error:', e.message));
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  startCycle() {
    if (this.isActive) {
      return { success: false, message: 'Cycle is already running' };
    }
    this._persistCycle(Date.now());
    return { success: true, message: 'Incubation cycle started', status: this.getStatus() };
  }

  stopCycle() {
    if (!this.isActive) {
      return { success: false, message: 'No active cycle to stop' };
    }
    this._persistCycle(null);
    return { success: true, message: 'Incubation cycle stopped', status: this.getStatus() };
  }

  resetCycle() {
    this._persistCycle(Date.now());
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

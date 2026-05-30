const { firestore } = require('../config/firebase');

// ─── Firestore Ref ───────────────────────────────────────────────────────────
// hatch/detection → { detectedCount: number, status: string, lastDetectionTime: string|null }

const DETECTION_DOC = () => firestore && firestore.collection('Intellihatch').doc('Hatch Detection');

class HatchDetectionService {
  constructor() {
    this.detectedCount = 0;
    this.status = 'idle'; // idle | active | complete
    this.lastDetectionTime = null;
    this.listeners = [];
    this._unsubscribe = null;

    this._init();
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  _init() {
    if (!firestore) {
      console.warn('[HatchDetectionService] Firestore not available. Detection will not persist.');
      return;
    }

    console.log('[HatchDetectionService] 🔥 Subscribing to Firestore hatch/detection...');

    this._unsubscribe = DETECTION_DOC().onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) return;

        const data = snapshot.data();
        this.detectedCount = data.detectedCount ?? this.detectedCount;
        this.status = data.status ?? this.status;
        this.lastDetectionTime = data.lastDetectionTime ?? this.lastDetectionTime;

        console.log(
          `[HatchDetectionService] (Firestore) Status: ${this.status}, Detected: ${this.detectedCount}`
        );
        this._notifyListeners();
      },
      (error) => {
        console.error('[HatchDetectionService] Firestore snapshot error:', error.message);
      }
    );
  }

  _notifyListeners() {
    const status = this.getDetectionStatus();
    this.listeners.forEach((fn) => fn(status));
  }

  _persist(patch) {
    if (!firestore) return;
    DETECTION_DOC()
      .set(patch, { merge: true })
      .catch((e) => console.error('[HatchDetectionService] Firestore write error:', e.message));
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  /** Get current hatch detection status. */
  getDetectionStatus() {
    return {
      detectedCount: this.detectedCount,
      status: this.status,
      lastDetectionTime: this.lastDetectionTime,
    };
  }

  /** Activate hatch detection. */
  activateDetection() {
    if (this.status === 'active') {
      return { success: false, message: 'Detection is already active' };
    }

    this.status = 'active';
    this._persist({ status: 'active' });
    console.log('[HatchDetectionService] Detection activated');

    // Simulate detection completing after a random delay (5–15 seconds)
    const detectionDelay = 5000 + Math.random() * 10000;
    setTimeout(() => {
      if (this.status === 'active') {
        const count = Math.floor(Math.random() * 6); // 0–5 eggs
        const now = new Date().toISOString();

        this.detectedCount = count;
        this.status = 'complete';
        this.lastDetectionTime = now;

        this._persist({ detectedCount: count, status: 'complete', lastDetectionTime: now });
        console.log(`[HatchDetectionService] Detection complete: ${count} detected`);
        this._notifyListeners();
      }
    }, detectionDelay);

    this._notifyListeners();
    return { success: true, message: 'Detection activated', status: this.getDetectionStatus() };
  }

  /** Re-activate: reset and start a fresh detection cycle. */
  reactivateDetection() {
    this.status = 'idle';
    this.detectedCount = 0;
    this._persist({ status: 'idle', detectedCount: 0, lastDetectionTime: null });
    console.log('[HatchDetectionService] Detection re-activated');
    return this.activateDetection();
  }

  /** Manually update the detected count (e.g. from a hardware sensor). */
  updateDetectedCount(count) {
    if (typeof count !== 'number' || count < 0) {
      return { success: false, error: 'Count must be a non-negative number' };
    }

    const now = new Date().toISOString();
    this.detectedCount = count;
    this.lastDetectionTime = now;

    this._persist({ detectedCount: count, lastDetectionTime: now });
    this._notifyListeners();

    return { success: true, detectedCount: this.detectedCount };
  }
}

module.exports = new HatchDetectionService();

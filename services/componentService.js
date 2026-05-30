const { firestore } = require('../config/firebase');

// ─── Firestore Ref ───────────────────────────────────────────────────────────
// components/statuses → { fan, bulb, humidifier, motor: 'WORKING'|'MALFUNCTION' }

const STATUSES_DOC = () => firestore && firestore.collection('components').doc('statuses');

const VALID_STATUSES = ['WORKING', 'MALFUNCTION'];
const VALID_COMPONENTS = ['fan', 'bulb', 'humidifier', 'motor'];

class ComponentService {
  constructor() {
    // In-memory state — all components default to WORKING
    this.components = {
      fan:        { name: 'Fan',        status: 'WORKING' },
      bulb:       { name: 'Bulb',       status: 'WORKING' },
      humidifier: { name: 'Humidifier', status: 'WORKING' },
      motor:      { name: 'Motor',      status: 'WORKING' },
    };
    this.listeners = [];
    this._unsubscribe = null;

    this._init();
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  _init() {
    if (!firestore) {
      console.warn('[ComponentService] Firestore not available. Component statuses will not persist.');
      return;
    }

    console.log('[ComponentService] 🔥 Subscribing to Firestore components/statuses...');

    this._unsubscribe = STATUSES_DOC().onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) return;

        const data = snapshot.data();

        VALID_COMPONENTS.forEach((key) => {
          if (data[key] && VALID_STATUSES.includes(data[key].toUpperCase())) {
            this.components[key].status = data[key].toUpperCase();
          }
        });

        console.log('[ComponentService] (Firestore) Component statuses updated.');
        this._notifyListeners();
      },
      (error) => {
        console.error('[ComponentService] Firestore snapshot error:', error.message);
      }
    );
  }

  _notifyListeners() {
    const statuses = this.getAllStatuses();
    this.listeners.forEach((fn) => fn(statuses));
  }

  _persistStatus(key, status) {
    if (!firestore) return;
    STATUSES_DOC()
      .set({ [key]: status }, { merge: true })
      .catch((e) => console.error('[ComponentService] Firestore write error:', e.message));
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  /** Get all component statuses. */
  getAllStatuses() {
    return { ...this.components };
  }

  /** Get a single component's status. */
  getStatus(componentKey) {
    const key = componentKey.toLowerCase();
    if (!VALID_COMPONENTS.includes(key)) {
      return { error: `Invalid component: ${componentKey}. Valid: ${VALID_COMPONENTS.join(', ')}` };
    }
    return this.components[key];
  }

  /** Set a component's status and persist to Firestore. */
  setStatus(componentKey, status) {
    const key = componentKey.toLowerCase();
    const upperStatus = status.toUpperCase();

    if (!VALID_COMPONENTS.includes(key)) {
      return { success: false, error: `Invalid component: ${componentKey}` };
    }
    if (!VALID_STATUSES.includes(upperStatus)) {
      return { success: false, error: `Invalid status: ${status}. Valid: ${VALID_STATUSES.join(', ')}` };
    }

    this.components[key].status = upperStatus;
    console.log(`[ComponentService] ${this.components[key].name} → ${upperStatus}`);

    // Persist to Firestore
    this._persistStatus(key, upperStatus);
    this._notifyListeners();

    return { success: true, component: this.components[key] };
  }
}

module.exports = new ComponentService();

const { firestore } = require('../config/firebase');

// ─── Firestore Ref ───────────────────────────────────────────────────────────
// controls/state → { Candling, Fan, Bulb, Mist, Motor: boolean, turnerPosition: string }

const STATE_DOC = () => firestore && firestore.collection('controls').doc('state');

const VALID_CONTROLS = ['candling', 'fan', 'bulb', 'mist', 'motor'];
const VALID_TURNER_POSITIONS = ['left', 'center', 'right'];

class ControlService {
  constructor() {
    // In-memory state — all controls default to OFF
    this.controls = {
      candling: { name: 'Candling', state: false },
      fan:      { name: 'Fan',      state: false },
      bulb:     { name: 'Bulb',     state: false },
      mist:     { name: 'Mist',     state: false },
      motor:    { name: 'Motor',    state: false },
    };
    this.turnerPosition = 'center';
    this.listeners = [];
    this._unsubscribe = null;

    this._init();
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  _init() {
    if (!firestore) {
      console.warn('[ControlService] Firestore not available. Controls will only update locally.');
      return;
    }

    console.log('[ControlService] 🔥 Subscribing to Firestore controls/state...');

    this._unsubscribe = STATE_DOC().onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) return;

        const data = snapshot.data();

        VALID_CONTROLS.forEach((key) => {
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
          const val = data[capitalizedKey];
          if (val !== undefined) {
            const state = typeof val === 'string' ? val.toUpperCase() === 'ON' : Boolean(val);
            if (this.controls[key].state !== state) {
              this.controls[key].state = state;
              console.log(
                `[ControlService] (Firestore) ${this.controls[key].name} → ${state ? 'ON' : 'OFF'}`
              );
            }
          }
        });

        if (data.turnerPosition && VALID_TURNER_POSITIONS.includes(data.turnerPosition)) {
          this.turnerPosition = data.turnerPosition;
        }

        this._notifyListeners('control:updated', this.getControls());
      },
      (error) => {
        console.error('[ControlService] Firestore snapshot error:', error.message);
      }
    );
  }

  _notifyListeners(eventType, data) {
    this.listeners.forEach((fn) => fn(eventType, data));
  }

  _persistState(patch) {
    if (!firestore) return;
    STATE_DOC()
      .set(patch, { merge: true })
      .catch((e) => console.error('[ControlService] Firestore write error:', e.message));
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  getControls() {
    return {
      controls: { ...this.controls },
      turnerPosition: this.turnerPosition,
    };
  }

  toggleControl(controlKey) {
    const key = controlKey.toLowerCase();

    if (!VALID_CONTROLS.includes(key)) {
      return {
        success: false,
        error: `Invalid control: ${controlKey}. Valid: ${VALID_CONTROLS.join(', ')}`,
      };
    }

    const newState = !this.controls[key].state;
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);

    // Persist to Firestore (onSnapshot will drive the state update)
    this._persistState({ [capitalizedKey]: newState });

    // Optimistic local update so callers get instant feedback
    this.controls[key].state = newState;
    console.log(`[ControlService] ${this.controls[key].name} → ${newState ? 'ON' : 'OFF'}`);
    this._notifyListeners('control:updated', this.getControls());

    return { success: true, control: key, state: newState };
  }

  setControl(controlKey, state) {
    const key = controlKey.toLowerCase();

    if (!VALID_CONTROLS.includes(key)) {
      return { success: false, error: `Invalid control: ${controlKey}` };
    }

    const boolState = Boolean(state);
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);

    this._persistState({ [capitalizedKey]: boolState });

    this.controls[key].state = boolState;
    console.log(`[ControlService] ${this.controls[key].name} → ${boolState ? 'ON' : 'OFF'}`);
    this._notifyListeners('control:updated', this.getControls());

    return { success: true, control: key, state: boolState };
  }

  setTurnerPosition(position) {
    const pos = position.toLowerCase();

    if (!VALID_TURNER_POSITIONS.includes(pos)) {
      return {
        success: false,
        error: `Invalid position: ${position}. Valid: ${VALID_TURNER_POSITIONS.join(', ')}`,
      };
    }

    this.turnerPosition = pos;
    this._persistState({ turnerPosition: pos });
    console.log(`[ControlService] Turner → ${pos}`);
    this._notifyListeners('turner:updated', { position: this.turnerPosition });

    return { success: true, position: this.turnerPosition };
  }
}

module.exports = new ControlService();

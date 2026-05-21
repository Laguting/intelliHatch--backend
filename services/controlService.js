const { database, ref, onValue, set } = require('../config/firebase');

const VALID_CONTROLS = ['candling', 'fan', 'bulb', 'mist', 'motor'];
const VALID_TURNER_POSITIONS = ['left', 'center', 'right'];

class ControlService {
  constructor() {
    // All manual controls default to OFF
    this.controls = {
      candling: { name: 'Candling', state: false },
      fan:      { name: 'Fan',      state: false },
      bulb:     { name: 'Bulb',     state: false },
      mist:     { name: 'Mist',     state: false },
      motor:    { name: 'Motor',    state: false },
    };

    // Egg turner starts in center position
    this.turnerPosition = 'center';

    this.listeners = [];

    if (database) {
      console.log('[ControlService] Connecting to Firebase for manual controls...');
      VALID_CONTROLS.forEach(key => {
        // e.g. Controls/fan
        // We title-case the first letter to match our proposed schema Controls/Fan
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        const controlRef = ref(database, `Controls/${capitalizedKey}`);
        
        onValue(controlRef, (snapshot) => {
          const val = snapshot.val();
          if (val !== null) {
            // handle both boolean and string "ON"/"OFF"
            const state = typeof val === 'string' ? val.toUpperCase() === 'ON' : Boolean(val);
            if (this.controls[key].state !== state) {
               this.controls[key].state = state;
               console.log(`[ControlService] (Firebase) ${this.controls[key].name} → ${state ? 'ON' : 'OFF'}`);
               this._notifyListeners('control:updated', this.getControls());
            }
          }
        });
      });
    } else {
      console.warn('[ControlService] Firebase not available. Controls will only update locally.');
    }
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  _notifyListeners(eventType, data) {
    this.listeners.forEach((fn) => fn(eventType, data));
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

    if (database) {
      const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
      set(ref(database, `Controls/${capitalizedKey}`), newState);
    } else {
      this.controls[key].state = newState;
      console.log(`[ControlService] ${this.controls[key].name} → ${newState ? 'ON' : 'OFF'}`);
      this._notifyListeners('control:updated', this.getControls());
    }

    return { success: true, control: key, state: newState };
  }

  setControl(controlKey, state) {
    const key = controlKey.toLowerCase();

    if (!VALID_CONTROLS.includes(key)) {
      return { success: false, error: `Invalid control: ${controlKey}` };
    }

    const boolState = Boolean(state);

    if (database) {
      const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
      set(ref(database, `Controls/${capitalizedKey}`), boolState);
    } else {
      this.controls[key].state = boolState;
      console.log(`[ControlService] ${this.controls[key].name} → ${boolState ? 'ON' : 'OFF'}`);
      this._notifyListeners('control:updated', this.getControls());
    }

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
    console.log(`[ControlService] Turner → ${pos}`);

    this._notifyListeners('turner:updated', { position: this.turnerPosition });

    return { success: true, position: this.turnerPosition };
  }
}

module.exports = new ControlService();

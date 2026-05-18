const VALID_CONTROLS = ['candling', 'fan', 'bulb', 'mist'];
const VALID_TURNER_POSITIONS = ['left', 'center', 'right'];

class ControlService {
  constructor() {
    // All manual controls default to OFF
    this.controls = {
      candling: { name: 'Candling', state: false },
      fan:      { name: 'Fan',      state: false },
      bulb:     { name: 'Bulb',     state: false },
      mist:     { name: 'Mist',     state: false },
    };

    // Egg turner starts in center position
    this.turnerPosition = 'center';

    this.listeners = [];
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  _notifyListeners(eventType, data) {
    this.listeners.forEach((fn) => fn(eventType, data));
  }

  /**
   * Get the full state of all controls and turner.
   */
  getControls() {
    return {
      controls: { ...this.controls },
      turnerPosition: this.turnerPosition,
    };
  }

  /**
   * Toggle a specific control ON/OFF.
   */
  toggleControl(controlKey) {
    const key = controlKey.toLowerCase();

    if (!VALID_CONTROLS.includes(key)) {
      return {
        success: false,
        error: `Invalid control: ${controlKey}. Valid: ${VALID_CONTROLS.join(', ')}`,
      };
    }

    this.controls[key].state = !this.controls[key].state;
    const newState = this.controls[key].state ? 'ON' : 'OFF';
    console.log(`[ControlService] ${this.controls[key].name} → ${newState}`);

    this._notifyListeners('control:updated', this.getControls());

    return { success: true, control: key, state: this.controls[key].state };
  }

  /**
   * Set a specific control to ON or OFF explicitly.
   */
  setControl(controlKey, state) {
    const key = controlKey.toLowerCase();

    if (!VALID_CONTROLS.includes(key)) {
      return { success: false, error: `Invalid control: ${controlKey}` };
    }

    this.controls[key].state = Boolean(state);
    const newState = this.controls[key].state ? 'ON' : 'OFF';
    console.log(`[ControlService] ${this.controls[key].name} → ${newState}`);

    this._notifyListeners('control:updated', this.getControls());

    return { success: true, control: key, state: this.controls[key].state };
  }

  /**
   * Set the egg turner position.
   */
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

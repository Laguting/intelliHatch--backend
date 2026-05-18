const VALID_STATUSES = ['WORKING', 'MALFUNCTION'];

const VALID_COMPONENTS = ['fan', 'bulb', 'humidifier', 'motor'];

class ComponentService {
  constructor() {
    // Default all components to WORKING
    this.components = {
      fan:        { name: 'Fan',        status: 'WORKING' },
      bulb:       { name: 'Bulb',       status: 'WORKING' },
      humidifier: { name: 'Humidifier', status: 'WORKING' },
      motor:      { name: 'Motor',      status: 'WORKING' },
    };
    this.listeners = [];
  }

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  _notifyListeners() {
    const statuses = this.getAllStatuses();
    this.listeners.forEach((fn) => fn(statuses));
  }

  /**
   * Get all component statuses.
   */
  getAllStatuses() {
    return { ...this.components };
  }

  /**
   * Get a single component's status.
   */
  getStatus(componentKey) {
    const key = componentKey.toLowerCase();
    if (!VALID_COMPONENTS.includes(key)) {
      return { error: `Invalid component: ${componentKey}. Valid: ${VALID_COMPONENTS.join(', ')}` };
    }
    return this.components[key];
  }

  /**
   * Set a component's status.
   */
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
    this._notifyListeners();

    return { success: true, component: this.components[key] };
  }
}

module.exports = new ComponentService();

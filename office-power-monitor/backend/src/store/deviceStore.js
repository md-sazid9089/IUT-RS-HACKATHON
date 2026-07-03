'use strict';

const { EventEmitter } = require('events');
const { buildDeviceCatalog, ROOMS } = require('../config/devices');

/**
 * @typedef {'fan'|'light'} DeviceType
 * @typedef {'on'|'off'} DeviceStatus
 *
 * @typedef {Object} Device
 * @property {string} id
 * @property {string} label
 * @property {DeviceType} type
 * @property {string} room               Room id.
 * @property {DeviceStatus} status
 * @property {number} wattage            Nameplate wattage.
 * @property {number} power              Instantaneous power draw in watts.
 * @property {string} lastChanged        ISO timestamp of last status transition.
 *
 * @typedef {Object} DeviceChange
 * @property {Device} device
 * @property {DeviceStatus} previousStatus
 * @property {DeviceStatus} nextStatus
 * @property {number} timestamp          Epoch ms.
 */

/**
 * DeviceStore is the single, in-memory source of truth for device state.
 * It emits:
 *   - 'device:changed'  (change: DeviceChange)  when a single device's status flips
 *   - 'devices:changed' (devices: Device[])     after any batch mutation completes
 *
 * The store owns no side effects beyond state + events. Callers (simulator,
 * alert engine, socket layer) subscribe to react.
 */
class DeviceStore extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, Device>} */
    this._byId = new Map();
    this._initialize();
  }

  /**
   * Seed the store with the static device catalog. All devices start OFF.
   * @private
   */
  _initialize() {
    const now = new Date().toISOString();
    for (const meta of buildDeviceCatalog()) {
      /** @type {Device} */
      const device = {
        id: meta.id,
        label: meta.label,
        type: meta.type,
        room: meta.room,
        status: 'off',
        wattage: meta.wattage,
        power: 0,
        lastChanged: now
      };
      this._byId.set(device.id, device);
    }
  }

  /**
   * @returns {Device[]} A defensive copy of all devices.
   */
  getAll() {
    return Array.from(this._byId.values()).map((d) => ({ ...d }));
  }

  /**
   * @param {string} id
   * @returns {Device|undefined}
   */
  getById(id) {
    const d = this._byId.get(id);
    return d ? { ...d } : undefined;
  }

  /**
   * @param {string} roomId
   * @returns {Device[]}
   */
  getByRoom(roomId) {
    return this.getAll().filter((d) => d.room === roomId);
  }

  /**
   * @returns {ReadonlyArray<{id:string,name:string}>}
   */
  getRooms() {
    return ROOMS;
  }

  /**
   * Attempt to set a device's status. No-op if the status is unchanged.
   * @param {string} id
   * @param {DeviceStatus} nextStatus
   * @param {number} [nowMs=Date.now()]
   * @returns {DeviceChange|null} null when unchanged or device missing.
   */
  setStatus(id, nextStatus, nowMs = Date.now()) {
    const device = this._byId.get(id);
    if (!device) return null;
    if (device.status === nextStatus) return null;

    const previousStatus = device.status;
    device.status = nextStatus;
    device.power = nextStatus === 'on' ? device.wattage : 0;
    device.lastChanged = new Date(nowMs).toISOString();

    /** @type {DeviceChange} */
    const change = {
      device: { ...device },
      previousStatus,
      nextStatus,
      timestamp: nowMs
    };
    this.emit('device:changed', change);
    return change;
  }

  /**
   * Apply a batch of status updates atomically and emit a single
   * 'devices:changed' event with the full new snapshot afterwards.
   * @param {Array<{id:string,status:DeviceStatus}>} updates
   * @param {number} [nowMs=Date.now()]
   * @returns {DeviceChange[]} Only the changes that actually occurred.
   */
  applyBatch(updates, nowMs = Date.now()) {
    /** @type {DeviceChange[]} */
    const changes = [];
    for (const u of updates) {
      const change = this.setStatus(u.id, u.status, nowMs);
      if (change) changes.push(change);
    }
    if (changes.length > 0) {
      this.emit('devices:changed', this.getAll());
    }
    return changes;
  }

  /**
   * How many seconds since this device last changed status.
   * @param {string} id
   * @param {number} [nowMs=Date.now()]
   * @returns {number}
   */
  getDwellSeconds(id, nowMs = Date.now()) {
    const device = this._byId.get(id);
    if (!device) return 0;
    return Math.max(0, Math.floor((nowMs - Date.parse(device.lastChanged)) / 1000));
  }
}

/** Singleton instance shared across the backend. */
const deviceStore = new DeviceStore();

module.exports = { DeviceStore, deviceStore };

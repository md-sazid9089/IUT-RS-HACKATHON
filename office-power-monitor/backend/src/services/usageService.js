'use strict';

const powerService = require('./powerService');
const energyService = require('./energyService');
const roomService = require('./roomService');

/**
 * @typedef {import('../store/deviceStore').DeviceStore} DeviceStore
 * @typedef {import('../store/energyStore').EnergyStore} EnergyStore
 *
 * @typedef {Object} UsageSnapshot
 * @property {number} timestamp
 * @property {number} currentPowerWatts
 * @property {Record<string, number>} powerByRoom
 * @property {Record<'fan'|'light', number>} powerByType
 * @property {{roomId:string|null, name:string|null, watts:number}} highestConsumingRoom
 * @property {number} energyTodayWh
 * @property {number} energyTodayKwh
 * @property {Array<{timestamp:number,powerWatts:number}>} samples
 */

/**
 * UsageService composes power + energy + room data into a single
 * snapshot the REST endpoint and Socket.IO broadcaster both consume.
 *
 * @param {DeviceStore} deviceStore
 * @param {EnergyStore} energyStore
 * @returns {UsageSnapshot}
 */
function buildUsageSnapshot(deviceStore, energyStore) {
  const devices = deviceStore.getAll();
  const rooms = deviceStore.getRooms();

  const currentPowerWatts = powerService.totalPower(devices);
  const perRoom = powerService.powerByRoom(devices);
  const perType = powerService.powerByType(devices);
  const highest = powerService.highestConsumingRoom(devices);
  const highestName = highest.roomId
    ? rooms.find((r) => r.id === highest.roomId)?.name ?? null
    : null;
  const energy = energyService.snapshot(energyStore);

  return {
    timestamp: Date.now(),
    currentPowerWatts,
    powerByRoom: perRoom,
    powerByType: perType,
    highestConsumingRoom: {
      roomId: highest.roomId,
      name: highestName,
      watts: highest.watts
    },
    energyTodayWh: energy.energyTodayWh,
    energyTodayKwh: energy.energyTodayKwh,
    samples: energy.samples
  };
}

module.exports = { buildUsageSnapshot, roomService };

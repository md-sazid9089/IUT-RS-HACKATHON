'use strict';

const config = require('../config');

/**
 * Pure helpers for office-hour reasoning. Kept separate so they can be
 * unit-tested without any timers or store state.
 */

/**
 * @param {number} [nowMs=Date.now()]
 * @returns {boolean} true if the current local hour is within office hours.
 */
function isOfficeHours(nowMs = Date.now()) {
  const hour = new Date(nowMs).getHours();
  return hour >= config.officeHourStart && hour < config.officeHourEnd;
}

/**
 * Probability that a device *transitions* on this tick, conditional on
 * having satisfied the minimum dwell time.
 *
 * During office hours devices tend to be ON, so:
 *   - OFF devices have a higher chance of turning ON
 *   - ON devices have a lower chance of turning OFF
 *
 * Outside office hours the biases invert.
 *
 * @param {'on'|'off'} currentStatus
 * @param {boolean} officeHours
 * @returns {number} probability in [0, 1]
 */
function transitionProbability(currentStatus, officeHours) {
  if (officeHours) {
    return currentStatus === 'off' ? 0.35 : 0.05;
  }
  return currentStatus === 'off' ? 0.03 : 0.4;
}

module.exports = { isOfficeHours, transitionProbability };

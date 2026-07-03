'use strict';

const config = require('./config');

/**
 * Thin fetch wrapper around the backend REST API. Uses global `fetch`
 * (Node 18+). Never hardcodes response bodies — always live data.
 */

/**
 * @param {string} path
 * @returns {Promise<any>}
 */
async function get(path) {
  const url = `${config.backendHttpUrl}${path}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Backend ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

const apiClient = {
  /** @returns {Promise<{devices: any[]}>} */
  getDevices: () => get('/api/devices'),
  /** @returns {Promise<{rooms: any[]}>} */
  getRooms: () => get('/api/rooms'),
  /** @param {string} id */
  getRoom: (id) => get(`/api/rooms/${encodeURIComponent(id)}`),
  /** @returns {Promise<{usage: any}>} */
  getUsage: () => get('/api/usage'),
  /** @returns {Promise<{alerts: any[]}>} */
  getAlerts: () => get('/api/alerts?status=active'),
  /** @returns {Promise<{incidents: any[]}>} */
  getIncidents: () => get('/api/incidents?status=active')
};

module.exports = apiClient;

'use strict';

const express = require('express');
const { buildUsageSnapshot } = require('../services/usageService');

/**
 * @param {Object} deps
 * @param {import('../store/deviceStore').DeviceStore} deps.deviceStore
 * @param {import('../store/energyStore').EnergyStore} deps.energyStore
 * @returns {import('express').Router}
 */
function createUsageRouter({ deviceStore, energyStore }) {
  const router = express.Router();

  router.get('/', (_req, res) => {
    res.json({ usage: buildUsageSnapshot(deviceStore, energyStore) });
  });

  return router;
}

module.exports = { createUsageRouter };

'use strict';

const { Simulator } = require('./simulator');
const { isOfficeHours, transitionProbability } = require('./officeHours');

module.exports = { Simulator, isOfficeHours, transitionProbability };

'use strict';

const { readdirSync } = require('fs');
const { join } = require('path');

const files = readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

const modules = files.reduce((modules, file) => {
  modules[file.slice(0, -3)] = require(join(__dirname, file));
  return modules;
}, {});

module.exports = modules;

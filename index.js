'use strict';

const { readdirSync } = require('fs');
const { join } = require('path');

const dir = join(__dirname, 'formatters');
const files = readdirSync(dir).filter(file => file.endsWith('.js'));

const modules = files.reduce((modules, file) => {
  modules[file.slice(0, -3)] = require(join(dir, file));
  return modules;
}, {});

module.exports = modules;

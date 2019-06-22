'use strict';

const ansi = {
  reset: '\x1b[0m',
  // eslint-disable-next-line no-control-regex
  light(str) { return str.startsWith('\u001b[') ? str.replace(/^\x1b\[(.*?)m/, '\x1b[$1;2m') : this.color(2, str); },
  red(str) { return this.color(31, str); },
  green(str) { return this.color(32, str); },
  yellow(str) { return this.color(33, str); },
  blue(str) { return this.color(34, str); },
  color(col, str) { return `\x1b[${col}m${str}${str.endsWith(this.reset) ? '': this.reset}`; },
  redStart: '\x1b[31m',
  greenStart: '\x1b[32m',
  yellowStart: '\x1b[33m'
};
ansi.tick = ansi.green('✔︎  ');
ansi.cross = ansi.red('✘  ');

module.exports = ansi;
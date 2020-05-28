'use strict';
let on = true;

const ansi = {
  reset: '\x1b[0m',
  light(str) {
    if (!on) return str;
    // eslint-disable-next-line no-control-regex
    return str.startsWith('\u001b[') ? str.replace(/^\x1b\[(.*?)m/, '\x1b[$1;2m') : this.color(2, str);
  },
  red(str) { return this.color(31, str); },
  green(str) { return this.color(32, str); },
  yellow(str) { return this.color(33, str); },
  blue(str) { return this.color(34, str); },
  color(col, str) {
    if (!on) return str;
    return `\x1b[${col}m${str}${str.endsWith(this.reset) ? '' : this.reset}`;
  },
  get tick() { return ansi.green('✔︎  '); },
  get cross() { return ansi.red('✘  '); },
  toggle(state) { on = state; }
};


module.exports = ansi;

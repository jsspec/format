'use strict';

const ansi = require('../lib/ansi');

const eventWrap = (executor, event, self) => {
  function listener(...args) {
    self[event](this, ...args);
  }
  executor.on(event, listener);
  return [event, listener];
};

class Null {
  static get description() {
    return 'Do nothing reporter';
  }
  constructor(executor) {
    if (executor && executor.settings && executor.settings.bland) ansi.toggle();

    this.listeners = [
      eventWrap(executor, 'fileStart', this),
      eventWrap(executor, 'fileEnd', this),
      eventWrap(executor, 'contextStart', this),
      eventWrap(executor, 'contextEnd', this),
      eventWrap(executor, 'exampleStart', this),
      eventWrap(executor, 'exampleEnd', this),
      eventWrap(executor, 'contextLevelFailure', this),
      eventWrap(executor, 'runEnd', this),
    ];
  }

  /* eslint-disable no-unused-vars */
  fileStart(uniqueName, fileName) {}
  fileEnd(uniqueName, fileName) {}
  contextStart(executor, context) {}
  contextEnd(executor, context) {}
  exampleStart(executor, example) {}
  exampleEnd(executor, example) {}
  contextLevelFailure(executor, example) {}

  /* eslint-enable no-unused-vars */
  runEnd(executor) {
    if (!executor) return;
    this.listeners.forEach(listener => executor.removeListener(listener[0], listener[1]));
  }
}

module.exports = Null;

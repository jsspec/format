'use strict';

const eventWrap = (executor, event, self) => {
  function listener(...args) { self[event](this, ...args); }
  executor.on(event, listener);
  return [event, listener];
};

class Null {
  static get description() {
    return 'Do nothing reporter';
  }
  constructor(executor) {
    this.listeners = [
      eventWrap(executor, 'fileStart', this),
      eventWrap(executor, 'fileEnd', this),
      eventWrap(executor, 'contextStart', this),
      eventWrap(executor, 'contextEnd', this),
      eventWrap(executor, 'exampleStart', this),
      eventWrap(executor, 'exampleEnd', this),
      eventWrap(executor, 'runEnd', this),
    ];
  }

  fileStart(executor, absoluteFilename) {

  }

  fileEnd(executor, absoluteFilename) {

  }

  contextStart(executor, id, contextType, description) {

  }

  contextEnd(executor, id) {

  }

  exampleStart(executor, id, contextId, exampleType, description) {

  }

  exampleEnd(executor, id, failure = null) {

  }

  runEnd(executor) {
    if (!executor) return;
    this.listeners.forEach(listener => executor.removeListener(listener[0], listener[1]));
  }
}

module.exports = Null;

'use strict';

const { EventEmitter } = require('events');

const ansi = require('../../lib/ansi');


const withoutStdOut = block => {
  const stolenStdOut = sinon.stub(process.stdout, 'write');
  try {
    block();
  } finally {
    stolenStdOut.restore();
  }
};

const events = [
  'fileStart',
  'fileEnd',
  'contextStart',
  'contextEnd',
  'exampleStart',
  'exampleEnd',
  'contextLevelFailure',
  'runEnd',
];

module.exports = () => sharedContext('event handlers defined', (FormatterClass) => {
  subject('formatter', () => new FormatterClass(executor));
  set('executor', () => {
    const ex = new EventEmitter();
    ex.settings = settings;
    return ex;
  });

  set('settings', {});

  beforeEach(() => {
    formatter;
    events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(1));
  });

  afterEach(() => executor.removeAllListeners());
  describe('defined handlers', () => {
    set('key', '__1');
    set('runnable', () => ({ base: key, kind: 'Context', description: '' }));

    beforeEach('#fileStart', () => {
      expect(() => formatter.fileStart(key)).not.to.throw();
    });

    it('#fileEnd', () => expect(() => withoutStdOut(() => formatter.fileEnd(key))).not.to.throw());
    it('#contextStart', () => expect(() => withoutStdOut(() => formatter.contextStart(null, runnable))).not.to.throw());
    it('#contextEnd', () => expect(() => formatter.contextEnd(null, runnable)).not.to.throw());
    it('#exampleStart', () => {
      expect(() => formatter.exampleStart(null, runnable)).not.to.throw();
    });

    it('#runEnd', () => {
      if (formatter.failures) {
        formatter.failures.push({ failure: { stack: '' } });
        formatter.failures.push({ failure: { stack: '' }, location: 'here' });
      }
      expect(() => withoutStdOut(() => formatter.runEnd())).not.to.throw();
    });

    it('#contextLevelFailure', () =>
      expect(() => withoutStdOut(() => formatter.contextLevelFailure(null, runnable))).not.to.throw());

    it('#exampleEnd', () => expect(() => withoutStdOut(() => formatter.exampleEnd(null, runnable))).not.to.throw());

    describe('#runEnd', () => {
      it('removes listeners', () => {
        withoutStdOut(() => executor.emit('runEnd'));
        events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(0));
      });

      it("doesn't explode if the executor doesn't get passed", () => {
        withoutStdOut(() => formatter.runEnd());
        events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(1));
      });
    });
  });
});

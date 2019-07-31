'use strict';

const Null = require('../../formatters/null');
const { EventEmitter } = require('events');
const executor = new EventEmitter();

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

describe('Null', () => {
  it('has a description',
    () => expect(Null.description).to.be.a('string').and.include('nothing'));

  afterEach(() => executor.removeAllListeners());

  describe('#constructor', () => {
    it('subscribes to all events',
      () => {
        events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(0));
        new Null(executor);
        events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(1));
      });
  });

  describe('instance', () => {
    let formatter;
    beforeEach(() => {
      formatter = new Null(executor);
      events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(1));
    });

    describe('#fileStart', () => {
      it('is defined', () => {
        expect(() => formatter.fileStart()).not.to.throw();
      });
    });

    describe('#fileEnd', () => {
      it('is defined', () => {
        expect(() => formatter.fileEnd()).not.to.throw();
      });
    });

    describe('#contextStart', () => {
      it('is defined', () => {
        expect(() => formatter.contextStart()).not.to.throw();
      });
    });

    describe('#contextEnd', () => {
      it('is defined', () => {
        expect(() => formatter.contextEnd()).not.to.throw();
      });
    });

    describe('#exampleStart', () => {
      it('is defined', () => {
        expect(() => formatter.exampleStart()).not.to.throw();
      });
    });

    describe('#exampleEnd', () => {
      it('is defined', () => {
        expect(() => formatter.exampleEnd()).not.to.throw();
      });
    });

    describe('#contextLevelFailure', () => {
      it('is defined', () => {
        expect(() => formatter.contextLevelFailure()).not.to.throw();
      });
    });

    describe('#runEnd', () => {
      it('removes listeners', () => {
        executor.emit('runEnd');
        events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(0));
      });

      it("doesn't explode if the executor doesn't get passed", () => {
        formatter.runEnd();
        events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(1));
      });
    });
  });
});

'use strict';

const Documentation = require('../documentation');
const { EventEmitter } = require('events');
const executor = new EventEmitter();

const events = [
  'fileStart',
  'fileEnd',
  'contextStart',
  'contextEnd',
  'exampleStart',
  'exampleEnd',
  'runEnd',
];

describe('Documentation', () => {
  it('has a description',
    () => expect(Documentation.description).to.be.a('string').and.include('Documentation'));

  afterEach(() => executor.removeAllListeners());

  xdescribe('#constructor', () => {
  });

  describe('instance', () => {
    let formatter;
    beforeEach(() => {
      formatter = new Documentation(executor);
      events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(1));
    });

    describe('#fileStart', () => {
      it('is defined', () => {
        expect(formatter.fileStart()).to.eql(undefined);
      });
    });

    describe('#fileEnd', () => {
      it('is defined', () => {
        expect(formatter.fileEnd()).to.eql(undefined);
      });
    });

    describe('#contextStart', () => {
      it('is defined', () => {
        expect(formatter.contextStart()).to.eql(undefined);
      });
    });

    describe('#contextEnd', () => {
      it('is defined', () => {
        expect(formatter.contextEnd()).to.eql(undefined);
      });
    });

    describe('#exampleStart', () => {
      it('is defined', () => {
        expect(formatter.exampleStart()).to.eql(undefined);
      });
    });

    describe('#exampleEnd', () => {
      it('is defined', () => {
        expect(formatter.exampleEnd()).to.eql(undefined);
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

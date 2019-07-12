'use strict';

const Documentation = require('../../formatters/documentation');
const { EventEmitter } = require('events');
const executor = new EventEmitter();

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const ansi = require('../../lib/ansi');

const withoutConsole = block => {
  const stolenConsole = sinon.stub(console, 'log');
  block();
  stolenConsole.restore();
};

const events = [
  'fileStart',
  'fileEnd',
  'contextStart',
  'contextEnd',
  'exampleStart',
  'exampleEnd',
  'afterHookFailure',
  'runEnd',
];

describe('Documentation', () => {
  it('has a description',
    () => expect(Documentation.description).to.be.a('string').and.include('Documentation'));

  afterEach(() => executor.removeAllListeners());

  xdescribe('#constructor', () => {});

  describe('instance', () => {
    let formatter;
    beforeEach(() => {
      formatter = new Documentation(executor);
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
        expect(() => withoutConsole(() => formatter.contextStart())).not.to.throw();
      });

      context('when the context is an "ignore" (X) type', () => {
        it('colors yellow', () => {
          let yellow;
          withoutConsole(() => {
            yellow = sinon.spy(ansi, 'yellow');
            formatter.contextStart(null, 0, 'XContext', 'test');
            yellow.restore();
          });
          expect(yellow).to.have.been.calledWith('test');
        });
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

    describe('#afterHookFailure', () => {
      it('is defined', () => {
        expect(() => withoutConsole(() => formatter.afterHookFailure(null, {description: ''}))).not.to.throw();
      });

      it('stores the failure', () => {
        const failed = { failure: true, description: '' };
        withoutConsole(() => {
          formatter.afterHookFailure(null, failed);
        });
        expect(formatter.failures).to.include(failed);
      });
    });

    describe('#exampleEnd', () => {
      it('is defined', () => {
        expect(() => withoutConsole(() => formatter.exampleEnd())).not.to.throw();
      });

      context('when time expires', () => {
        it('adds a time in red', function(done) {
          this.timeout(3000);
          formatter.exampleStart();
          setTimeout(
            () => {
              let spy;
              withoutConsole(() => {
                spy = sinon.spy(ansi, 'red');
                formatter.exampleEnd();
                spy.restore();
              });
              expect(spy).to.have.been.calledWith(sinon.match(/\{\d*\s*ms}/));
              done();
            }, 2001);
        });
      });

      context('with a failed context', () => {
        it('stores the failure', () => {
          const failed = { failure: true };
          withoutConsole(() => {
            formatter.exampleEnd(null, failed);
          });
          expect(formatter.failures).to.include(failed);
        });
      });
    });

    describe('#runEnd', () => {
      it('removes listeners', () => {
        withoutConsole(() => executor.emit('runEnd'));
        events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(0));
      });

      it("doesn't explode if the executor doesn't get passed", () => {
        withoutConsole(() => formatter.runEnd());
        events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(1));
      });

      context('with failed contexts', () => {
        it('accesses the failure', () => {
          const red = sinon.spy(ansi, 'red');
          const green = sinon.spy(ansi, 'green');
          const light = sinon.spy(ansi, 'light');
          withoutConsole(() => {
            const examples = [{
              failure: {
                constructor: { name: 'AssertionError' },
                message: 'THE MESSAGE',
                actual: 'wrong\nsame',
                expected: 'right\nsame',
                stack: ''
              }
            }, { failure: { stack: 'THE STACK' } }];
            formatter.exampleEnd(null, examples[0]);
            formatter.exampleEnd(null, examples[1]);

            formatter.runEnd();
          });
          expect(red).to.have.been.calledWith(sinon.match(new RegExp('.*THE MESSAGE')));
          expect(light).to.have.been.calledWith('THE STACK');
          expect(red).to.have.been.calledWith(sinon.match(/Actual/));
          expect(green).to.have.been.calledWith(sinon.match(/Expected/));
          red.restore();
          green.restore();
          light.restore();
        });

        context('With pending tests', () => {
          it('sets it to yellow', () => {
            const yellow = sinon.spy(ansi, 'yellow');
            withoutConsole(() => {
              formatter.exampleEnd(null, {kind: 'pending'});
              formatter.contextStart(null, 1, 'XContext', 'hello');
              formatter.contextEnd();
              formatter.contextStart(null, 1, 'XContext', 'hello yourself');
              formatter.contextEnd();
              formatter.runEnd();
            });
            yellow.restore();
            expect(yellow).to.have.been.calledWith('·· ');
            expect(yellow).to.have.been.calledWith('hello');
            expect(yellow).to.have.been.calledWith('hello yourself');
          });
        });
      });
      describe('#time', () => {
        it("reports seconds when it's more than 1 sec", () => {
          formatter.timing.start = BigInt(1000000000);
          formatter.timing.end = BigInt(5000000000);

          expect(formatter.time).to.match(/\d+s/);
        });
      });
    });
  });
});

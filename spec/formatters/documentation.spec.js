'use strict';

const Documentation = require('../../formatters/documentation');
const { EventEmitter } = require('events');
const executor = new EventEmitter();

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

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

describe('Documentation', () => {
  it('has a description',
    () => expect(Documentation.description).to.be.a('string').and.include('Documentation'));

  afterEach(() => executor.removeAllListeners());

  describe('instance', () => {
    let formatter;
    beforeEach(() => {
      formatter = new Documentation(executor);
      events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(1));
    });

    describe('#fileStart', () => {
      it('is defined', () => {
        expect(() => formatter.fileStart('')).not.to.throw();
      });
    });

    describe('#fileEnd', () => {
      it('is defined', () => {
        expect(() => formatter.fileEnd('')).not.to.throw();
      });
    });

    describe('#contextStart', () => {
      it('is defined', () => {
        expect(() => withoutStdOut(() => formatter.contextStart())).not.to.throw();
      });

      context('when the context is an "ignore" (X) type', () => {
        it('colors yellow', () => {
          let yellow;
          withoutStdOut(() => {
            yellow = sinon.spy(ansi, 'yellow');
            formatter.contextStart(null, { kind: 'X', description: 'test' });
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

    describe('#runEnd', () => {
      it('triggers the header on summary', () => {
        formatter.failures.push({ failure: { stack: '' } });
        formatter.failures.push({ failure: { stack: '' }, location: 'here' });
        expect(() => withoutStdOut(() => formatter.runEnd())).not.to.throw();
      });
    });

    describe('#contextLevelFailure', () => {
      it('is defined', () => {
        expect(() => withoutStdOut(() => formatter.contextLevelFailure(null, { description: '' }))).not.to.throw();
      });

      it('stores the failure', () => {
        const failed = { failure: true, description: '' };
        withoutStdOut(() => {
          formatter.contextLevelFailure(null, failed);
        });
        expect(formatter.failures).to.include(failed);
      });
    });

    describe('#exampleEnd', () => {
      it('is defined', () => {
        expect(() => withoutStdOut(() => formatter.exampleEnd())).not.to.throw();
      });

      context('when time expires', () => {
        it('adds a time in red', () => {
          formatter.exampleStart();
          return new Promise(resolve => setTimeout(resolve, 2))
            .then(() => {
              let spy;
              withoutStdOut(() => {
                spy = sinon.spy(ansi, 'red');
                formatter.exampleEnd(null, { timeout: 1 });
                spy.restore();
              });
              expect(spy).to.have.been.calledWith(sinon.match(/\{\d*\s*ms}/));
            });
        });
      });

      context('when slow', () => {
        it('adds a time in yellow', () => {
          formatter.exampleStart();
          return new Promise(resolve => setTimeout(resolve, 11))
            .then(() => {
              let spy;
              withoutStdOut(() => {
                spy = sinon.spy(ansi, 'yellow');
                formatter.exampleEnd(null, { timeout: 30 });
                spy.restore();
              });
              expect(spy).to.have.been.calledWith(sinon.match(/\{\d*\s*ms}/));
            });
        });
      });

      context('when very slow', () => {
        it('adds a time in red', () => {
          formatter.exampleStart();
          return new Promise(resolve => setTimeout(resolve, 21))
            .then(() => {
              let spy;
              withoutStdOut(() => {
                spy = sinon.spy(ansi, 'red');
                formatter.exampleEnd(null, { timeout: 30 });
                spy.restore();
              });
              expect(spy).to.have.been.calledWith(sinon.match(/\{\d*\s*ms}/));
            });
        });
      });

      context('with a failed context', () => {
        it('stores the failure', () => {
          const failed = { failure: true };
          withoutStdOut(() => {
            formatter.exampleEnd(null, failed);
          });
          expect(formatter.failures).to.include(failed);
        });
      });
    });

    describe('#runEnd', () => {
      it('removes listeners', () => {
        withoutStdOut(() => executor.emit('runEnd'));
        events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(0));
      });

      it("doesn't explode if the executor doesn't get passed", () => {
        withoutStdOut(() => formatter.runEnd());
        events.forEach(event => expect(EventEmitter.listenerCount(executor, event)).to.eql(1));
      });

      context('with failed contexts', () => {
        it('accesses the failure', () => {
          const red = sinon.spy(ansi, 'red');
          const green = sinon.spy(ansi, 'green');
          const light = sinon.spy(ansi, 'light');
          withoutStdOut(() => {
            const examples = [{
              base: '__x',
              failure: {
                constructor: { name: 'AssertionError' },
                message: 'THE MESSAGE',
                actual: 'wrong\nsame',
                expected: 'right\nsame',
                stack: 'THE MESSAGE'
              }
            }, {
              base: '__x',
              failure: { stack: 'message\nTHE STACK' }
            }];
            formatter.fileStart(null, '__x');
            formatter.exampleEnd(null, examples[0]);
            formatter.exampleEnd(null, examples[1]);
            formatter.fileEnd(null, '__x');

            formatter.runEnd();
          });
          expect(red).to.have.been.calledWithMatch(/.*THE MESSAGE/);
          expect(light).to.have.been.calledWith('THE STACK');
          expect(red).to.have.been.calledWithMatch(/Actual/);
          expect(green).to.have.been.calledWithMatch(/Expected/);
          red.restore();
          green.restore();
          light.restore();
        });

        context('With pending tests', () => {
          it('sets it to yellow', () => {
            const yellow = sinon.spy(ansi, 'yellow');
            withoutStdOut(() => {
              formatter.exampleEnd(null, { kind: 'pending' });
              formatter.contextStart(null, { kind: 'XContext', description: 'hello' });
              formatter.contextEnd();
              formatter.contextStart(null, { kind: 'XContext', description: 'hello yourself' });
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
    context('with multiple streams', () => {
      it('presents both', () => {
        const stdOutWrite = sinon.stub(process.stdout, 'write');
        try {
          formatter.contextStart(null, { kind: '', base: '__x', description: 'first' });
          formatter.contextStart(null, { kind: '', base: '__y', description: 'second' });
          expect(stdOutWrite).to.have.been.calledWithMatch(/first/);
          expect(stdOutWrite).not.to.have.been.calledWithMatch(/second/);
          formatter.contextEnd(null, { base: '__x' });
          formatter.contextEnd(null, { base: '__y' });
          formatter.fileEnd(null, '__y');
          formatter.fileEnd(null, '__x');
          expect(stdOutWrite).to.have.been.calledWithMatch(/second/);
        } finally {
          stdOutWrite.restore();
        }
      });
    });
  });
});

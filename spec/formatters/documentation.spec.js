'use strict';

const MILLION = 1000000n;

const Documentation = require('../../formatters/documentation');

require('./required_handlers_shared')();

const ansi = require('../../lib/ansi');

const withoutStdOut = block => {
  const stolenStdOut = sinon.stub(process.stdout, 'write');
  try {
    block();
  } finally {
    stolenStdOut.restore();
  }
};

describe('Documentation', () => {
  require('./color_context_shared')();
  includeContext('event handlers defined', Documentation);

  it('has a description', () => expect(Documentation.description).to.be.a('string').and.include('Documentation'));

  describe('#contextLevelFailure', () => {
    it('stores the failure', () => {
      const failed = { failure: true, description: '' };
      withoutStdOut(() => formatter.contextLevelFailure(null, failed));
      expect(formatter.failures).to.include(failed);
    });
  });

  describe('#exampleEnd', () => {
    set('key', '__1');
    set('runnable', () => ({ base: key, kind: 'Context', timeout: timeout }));
    set('timeout', 30);
    set('runTime', () => 1 + timeout / 3);

    set('hrtime', () =>
      sinon
        .stub(process.hrtime, 'bigint')
        .onFirstCall()
        .returns(1n)
        .onSecondCall()
        .returns(BigInt(runTime + 1) * MILLION)
    );

    afterEach(() => hrtime.restore());

    beforeEach('#fileStart', () => {
      formatter.fileStart(key);
      hrtime;
      formatter.exampleStart(null, runnable);
    });

    includeContext('color spy');

    context('when time expires', () => {
      set('runTime', () => timeout + 1);
      it('adds a time in red', () => {
        withoutStdOut(() => formatter.exampleEnd(null, runnable));
        expect(red).to.have.been.calledWith(sinon.match(/\{\d*\s*ms}/));
      });
    });

    context('when slow', () => {
      set('runtime', () => 1 + timeout / 3);

      it('adds a time in yellow', () => {
        withoutStdOut(() => formatter.exampleEnd(null, runnable));
        expect(yellow).to.have.been.calledWith(sinon.match(/\{\d*\s*ms}/));
      });
    });

    context('when very slow', () => {
      set('runTime', () => 1 + (2 * timeout) / 3);

      it('adds a time in red', () => {
        withoutStdOut(() => formatter.exampleEnd(null, runnable));
        expect(red).to.have.been.calledWith(sinon.match(/\{\d*\s*ms}/));
      });
    });

    context('with a failed context', () => {
      it('stores the failure', () => {
        const failed = { failure: true };
        withoutStdOut(() => formatter.exampleEnd(null, failed));
        expect(formatter.failures).to.include(failed);
      });
    });
  });

  describe('color output', () => {
    includeContext('color spy');

    describe('#contextStart', () => {
      context('when the context is an "ignore" (X) type', () => {
        it('colors yellow', () => {
          withoutStdOut(() => {
            formatter.contextStart(null, { kind: 'X', description: 'test' });
          });
          expect(yellow).to.have.been.calledWith('test');
        });
      });
    });

    describe('#runEnd', () => {
      context('when run with random', () => {
        set('settings', { random: true, seed: 1234 });

        it('reports the seed', () => {
          const stdOutWrite = sinon.stub(process.stdout, 'write');
          try {
            formatter.fileStart(null, '__x');
            formatter.fileEnd(null, '__x');
            formatter.runEnd(executor);

            expect(stdOutWrite).to.have.been.calledWithMatch(/seed: 1234/);
          } finally {
            stdOutWrite.restore();
          }
        });
      });

      context('with failed contexts', () => {
        set('failure', { stack: 'message\nTHE STACK' });

        set('examples', () => [
          {
            base: '__x',
            location: 'some_file.js:123',
            failure: {
              constructor: { name: 'AssertionError' },
              message: 'THE MESSAGE',
              actual: 'wrong\nsame',
              expected: 'right\nsame',
              stack: 'THE MESSAGE',
            },
          },
          {
            base: '__x',
            failure,
          },
        ]);

        context('when one of the objects is a function', () => {
          set('failure', { actual: setInterval, expected: 1 });

          it('works fine', () => {
            withoutStdOut(() => {
              formatter.fileStart(null, '__x');
              formatter.exampleEnd(null, examples[0]);
              formatter.exampleEnd(null, examples[1]);
              formatter.fileEnd(null, '__x');

              formatter.runEnd(executor);
            });
            expect(red).to.have.been.calledWithMatch(/ - \[function setInterval\]/);
            expect(green).to.have.been.calledWithMatch(/ \+ 1/);
          });
        });

        context('when executed with require', () => {
          set('settings', () => ({ require: ['required_file.js'] }));

          it('reports the require files in the executable line', () => {
            withoutStdOut(() => {
              formatter.fileStart(null, '__x');
              formatter.exampleEnd(null, examples[0]);
              formatter.exampleEnd(null, examples[1]);
              formatter.fileEnd(null, '__x');

              formatter.runEnd(executor);
            });

            expect(red).to.have.been.calledWithMatch(new RegExp(` -r ${settings.require.join(' ')} --`));
          });
        });

        context('with no stack', () => {
          set('failure', { message: 'Oops' });

          it('reports just the message', () => {
            withoutStdOut(() => {
              formatter.fileStart(null, '__x');
              formatter.exampleEnd(null, examples[0]);
              formatter.exampleEnd(null, examples[1]);
              formatter.fileEnd(null, '__x');

              formatter.runEnd(executor);
            });

            expect(red).to.have.been.calledWithMatch(/\s*Oops/);
          });
        });

        it('accesses the failure', () => {
          withoutStdOut(() => {
            formatter.fileStart(null, '__x');
            formatter.exampleEnd(null, examples[0]);
            formatter.exampleEnd(null, examples[1]);
            formatter.fileEnd(null, '__x');

            formatter.runEnd(executor);
          });
          expect(red).to.have.been.calledWithMatch(/.*THE MESSAGE/);
          expect(light).to.have.been.calledWith('THE STACK');
          expect(red).to.have.been.calledWithMatch(/Actual/);
          expect(green).to.have.been.calledWithMatch(/Expected/);
        });

        context('With pending tests', () => {
          it('sets it to yellow', () => {
            withoutStdOut(() => {
              formatter.exampleEnd(null, { kind: 'pending', description: 'example' });
              formatter.contextStart(null, { kind: 'XContext', description: 'hello' });
              formatter.contextEnd(null, {});
              formatter.contextStart(null, { kind: 'XContext', description: 'hello yourself' });
              formatter.contextEnd(null, {});
              formatter.runEnd();
            });
            expect(yellow).to.have.been.calledWith('·· ');
            expect(yellow).to.have.been.calledWith('hello');
            expect(yellow).to.have.been.calledWith('hello yourself');
            expect(light).to.have.been.calledWith('example');
          });
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

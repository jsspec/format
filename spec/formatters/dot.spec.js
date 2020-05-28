'use strict';

const Dot = require('../../formatters/dot');
const MILLION = 1000000n;

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

describe('Dot', () => {
  require('./color_context_shared')();
  includeContext('event handlers defined', Dot);

  it('has a description',
    () => expect(Dot.description).to.be.a('string').and.include('Dot'));


  describe('#contextLevelFailure', () => {
    it('stores the failure', () => {
      const failed = { failure: true, description: '' };
      withoutStdOut(() => {
        formatter.contextLevelFailure(null, failed);
      });
      expect(formatter.failures).to.include(failed);
    });
  });

  includeContext('color spy');
  set('timeout', 30);
  set('runTime', () => 1 + timeout / 3);

  set('key', '__1');
  set('runnable', () => ({ base: key, kind: 'Context', timeout: timeout }));

  set('hrtime', () => sinon.stub(process.hrtime, 'bigint')
    .onFirstCall().returns(1n)
    .onSecondCall().returns(BigInt(runTime + 1) * MILLION)
    .returns(1n));

  beforeEach('#fileStart', () => {
    formatter.fileStart(key);
    hrtime;
    formatter.exampleStart(null, runnable);
  });

  afterEach(() => hrtime.restore());

  describe('#exampleEnd', () => {
    context('with a failed context', () => {
      it('stores the failure', () => {
        const failed = { failure: true };
        withoutStdOut(() => formatter.exampleEnd(null, failed));
      });
    });

    context('when a little slow', () => {
      it('dots yellow', () => {
        withoutStdOut(() => formatter.exampleEnd(null, runnable));
        expect(yellow).to.have.been.calledWith('.');
      });
    });

    context('when real slow', () => {
      set('runTime', () => 1 + 2 * timeout / 3);

      it('dots red', { timeout: 400 }, () => {
        withoutStdOut(() => formatter.exampleEnd(null, runnable));
        expect(red).to.have.been.calledWith('.');
      });
    });
  });

  describe('#runEnd', () => {
    context('with failed contexts', () => {
      it('accesses the failure', () => {
        withoutStdOut(() => {
          const examples = [{
            failure: {
              constructor: { name: 'AssertionError' },
              message: 'THE MESSAGE',
              actual: 'wrong\nsame',
              expected: 'right\nsame',
              stack: ''
            }
          }, { failure: { stack: 'message\nTHE STACK' } }];
          formatter.exampleEnd(null, examples[0]);
          formatter.exampleEnd(null, examples[1]);

          formatter.runEnd();
        });
        expect(red).to.have.been.calledWith(sinon.match(new RegExp('.*THE MESSAGE')));
        expect(light).to.have.been.calledWith('THE STACK');
        expect(red).to.have.been.calledWith(sinon.match(/Actual/));
        expect(green).to.have.been.calledWith(sinon.match(/Expected/));
      });

      context('With pending tests', () => {
        it('sets it to yellow', () => {
          withoutStdOut(() => {
            formatter.exampleEnd(null, { kind: 'pending' });
            formatter.contextStart(null, 1, 'XContext', 'hello');
            formatter.contextEnd(null, runnable);
            formatter.contextStart(null, 1, 'XContext', 'hello yourself');
            formatter.contextEnd(null, runnable);
            formatter.runEnd();
          });
          expect(yellow).to.have.been.calledWith('?');
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

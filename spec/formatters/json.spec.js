'use strict';

const Json = require('../../formatters/json');

require('./required_handlers_shared')();

describe('Json', () => {
  it('has a description', () => expect(Json.description).to.be.a('string').and.include('JSON'));

  includeContext('event handlers defined', Json);
  set('kind', 'it');
  set('failure', false);
  set('example', () => exampleValues);
  set('exampleValues', () => ({ kind, base: '__x', description: 'first', failure }));

  set('consoleLog', () => sinon.stub(console, 'log'));

  beforeEach(() => formatter.fileStart('__x'));

  describe('status', () => {
    beforeEach(() => {
      formatter.exampleStart(null, example);
      formatter.exampleEnd(null, example);
    });

    context('when pending', () => {
      set('kind', 'pending');

      it('sets pending', () => {
        try {
          consoleLog;
          formatter.runEnd(null);
          expect(consoleLog).to.have.been.calledWithMatch(/"status":"pending"/);
        } finally {
          consoleLog.restore();
        }
      });
    });

    context('when failed', () => {
      set('failure', { message: 'it broke', stack: 'here:1' });

      it('sets pending', () => {
        try {
          consoleLog;
          formatter.runEnd(null);
          expect(consoleLog).to.have.been.calledWithMatch(/"status":"failed"/);
        } finally {
          consoleLog.restore();
        }
      });
    });
  });

  describe('when #toJSON is available', () => {
    set('example', () => ({ toJSON: sinon.fake.returns(exampleValues), ...exampleValues }));

    it('calls to JSON', () => {
      try {
        formatter.exampleStart(null, example);
        formatter.exampleEnd(null, example);
        expect(example.toJSON).to.have.been.called;
      } finally {
        consoleLog.restore();
      }
    });

    describe('with a context failure', () => {
      it('calls to JSON', () => {
        try {
          formatter.contextLevelFailure(null, example);

          expect(example.toJSON).to.have.been.called;
        } finally {
          consoleLog.restore();
        }
      });
    });
  });

  context('when watching', () => {
    beforeEach(() => {
      consoleLog;
      formatter.watching = true;
    });
    it('calls to console', () => {
      try {
        expect(consoleLog).not.to.have.been.called;
        formatter.fileEnd('__x');
        expect(consoleLog).to.have.been.called;
      } finally {
        consoleLog.restore();
      }
    });
  });
});

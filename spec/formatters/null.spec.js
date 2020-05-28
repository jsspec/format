'use strict';

const Null = require('../../formatters/null');
const ansi = require('../../lib/ansi');

require('./required_handlers_shared')();

describe('Null', () => {

  it('has a description',
    () => expect(Null.description).to.be.a('string').and.include('nothing'));

  includeContext('event handlers defined', Null);

  context('executor is bland', () => {
    set('toggleMock', () => sinon.spy(ansi, 'toggle'));
    set('settings', () => ({ bland }));
    set('bland', true);

    before(() => toggleMock);
    after(() => {
      ansi.toggle(true);
      ansi.toggle.restore();
    });

    it('toggles colour', () => {
      expect(toggleMock).to.have.been.called;
    });
  });
});

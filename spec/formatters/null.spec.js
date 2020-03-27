'use strict';

const Null = require('../../formatters/null');

require('./required_handlers_shared')();

describe('Null', () => {
  it('has a description',
    () => expect(Null.description).to.be.a('string').and.include('nothing'));

  includeContext('event handlers defined', Null);
});

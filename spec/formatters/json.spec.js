'use strict';

const Json = require('../../formatters/json');

require('./required_handlers_shared')();

describe('Json', () => {
  it('has a description',
    () => expect(Json.description).to.be.a('string').and.include('JSON'));

  includeContext('event handlers defined', Json);
});

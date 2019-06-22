'use strict';

const formatters = require('../index');

describe('collection of default formatters', () => {
  it('has documentation (& d)', () => {
    expect(formatters).to.have.property('documentation');
    expect(formatters.d).to.eql(formatters.documentation);
  });
});
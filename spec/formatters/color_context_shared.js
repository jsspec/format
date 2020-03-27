const sinon = require('sinon');
const ansi = require('../../lib/ansi');

module.exports = () => sharedContext('color spy', () => {
  set('yellow', () => sinon.spy(ansi, 'yellow'));
  set('red', () => sinon.spy(ansi, 'red'));
  set('green', () => sinon.spy(ansi, 'green'));
  set('light', () => sinon.spy(ansi, 'light'));

  beforeEach(() => [yellow, red, green, light]);

  afterEach(() => {
    yellow.restore();
    red.restore();
    green.restore();
    light.restore();
  });
});
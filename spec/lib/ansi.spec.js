'use strict';

const ansi = require('../../lib/ansi');

describe('ansi', () => {
  it('colourises', () => {
    expect(ansi.red('')).to.eql('\x1b[31m\x1b[0m');
    expect(ansi.green('')).to.eql('\x1b[32m\x1b[0m');
    expect(ansi.yellow('')).to.eql('\x1b[33m\x1b[0m');
    expect(ansi.blue('')).to.eql('\x1b[34m\x1b[0m');
  });

  describe('lightness', () => {
    context('with no leading escape', () => {
      it('creates a full escape', () => {
        expect(ansi.light('')).to.eql('\x1b[2m\x1b[0m');
      });
    });

    context('with a leading escape', () => {
      it('modifies it', () => {
        expect(ansi.light(ansi.green(''))).to.eql('\x1b[32;2m\x1b[0m');
      });
    });
  });

  describe('content has an ending reset', () => {
    it('just leaves one reset', () => {
      expect(ansi.blue('test' + ansi.green(''))).to.eql('\x1b[34mtest\x1b[32m\x1b[0m');
    });
  });

  it('has checks', () => {
    expect(ansi.tick).to.eql('\u001b[32m✔︎  \u001b[0m');
    expect(ansi.cross).to.eql('\u001b[31m✘  \u001b[0m');
  });

  describe('.toggle', () => {
    beforeEach(() => ansi.toggle(false));
    afterEach(() => ansi.toggle(true));

    it('does not colourise', () => {
      expect(ansi.red('')).to.eql('');
      expect(ansi.green('')).to.eql('');
      expect(ansi.yellow('')).to.eql('');
      expect(ansi.blue('')).to.eql('');
    });

    describe('lightness', () => {
      it('does nothing', () => {
        expect(ansi.light('')).to.eql('');
      });
    });

    it('has checks', () => {
      expect(ansi.tick).to.eql('✔︎  ');
      expect(ansi.cross).to.eql('✘  ');
    });

  });
});

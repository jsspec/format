const Null = require('./null');

class Documentation extends Null {
  static get description() {
    return 'Documentation style reporter';
  }

  constructor(emitter) {
    super(emitter);
  }
}

module.exports = Documentation;
'use strict';
const MILLION = BigInt(1000000);

const Documentation = require('./documentation');

const ansi = require('../lib/ansi');

class Dot extends Documentation {
  static get description() {
    return 'Dot style reporter';
  }

  constructor(emitter) {
    super(emitter);
  }

  contextStart() {}
  contextEnd() {}

  exampleEnd(_, example = {}) {
    if (example.kind === 'pending') {
      this.pendingTotal++;
      process.stdout.write(ansi.yellow('?'));
      return;
    }

    const end = process.hrtime.bigint();
    const start = this.stack.pop() || end;

    let duration = Number((end - start) / MILLION);

    if (example.failure) {
      this.failures.push(example);
    }
    this.total++;

    if (example.failure) {
      process.stdout.write(ansi.red('X'));
    } else {
      if ( duration > 200 )
        process.stdout.write(ansi.light(ansi.yellow('.')));
      else
        process.stdout.write(ansi.green('.'));
    }
  }

  afterHookFailure(_, example = {}) {
    process.stdout.write(ansi.red('X'));

    this.failures.push(example);
  }

  runEnd(executor) {
    // process.stdout.write('\n');
    super.runEnd(executor);
  }
}

module.exports = Dot;

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

  contextStart(_, context = { kind: '' }) { this.stream(context).depth++; }

  contextLevelFailure(_, exampleOrContext) {
    process.stdout.write(ansi.red('X'));
    this.failures.push(exampleOrContext);
  }

  exampleEnd(_, example = {}) {
    if (example.kind === 'pending') {
      this.pendingTotal++;
      process.stdout.write(ansi.yellow('?'));
      return;
    }

    const stream = this.stream(example);
    const end = process.hrtime.bigint();
    const start = stream.exampleStart || end;

    let duration = Number((end - start) / MILLION);

    if (example.failure) {
      this.failures.push(example);
    }
    this.total++;

    if (example.failure) {
      process.stdout.write(ansi.red('X'));
    } else {
      if (example.timeout && duration > 2 * example.timeout / 3) process.stdout.write(ansi.light(ansi.red('.')));
      else if (example.timeout && duration > example.timeout / 3) process.stdout.write(ansi.light(ansi.yellow('.')));
      else process.stdout.write(ansi.green('.'));
    }
  }

  runEnd(executor) {
    process.stdout.write('\n');
    super.runEnd(executor);
  }
}

module.exports = Dot;

'use strict';
const diff = require('diff');
const MILLION = BigInt(1000000);

const Null = require('./null');

const ansi = require('../lib/ansi');

class TargetStream {
  constructor() {
    this.active = false;
    this.stream = '';
    this.depth = 0;
  }
  write(data) {
    if (this.active) {
      process.stdout.write(data);
    } else {
      this.stream += data;
    }
  }

  activate() {
    if (this.stream.length) {
      process.stdout.write(this.stream);
      this.stream = '';
    }
    this.active = true;
  }

  close() {
    this.closed = true;
  }

  start(time) {
    this.exampleStart = time;
  }
}

class Documentation extends Null {
  static get description() {
    return 'Documentation style reporter';
  }

  constructor(emitter) {
    super(emitter);
    this.timing = { start: process.hrtime.bigint() };
    this.streams = new Map();
    this.orderedStreamKeys = [];
    this.failures = [];
    this.total = 0;
    this.pendingTotal = 0;
  }

  stream(context) {
    const base = context.base;
    let stream = this.streams.get(base);
    if (!stream) {
      stream = new TargetStream();
      this.streams.set(base, stream);
      if (!this.orderedStreamKeys.length) stream.activate();
      this.orderedStreamKeys.push(base);
    }
    return stream;
  }

  endStream(name) {
    let stream = this.streams.get(name);

    if (!stream) return;
    stream.close();
    if (!stream.active) return;

    while (stream && stream.closed) {
      this.orderedStreamKeys.shift();
      this.streams.delete(name);
      let activeStreamKey = this.orderedStreamKeys[0];
      stream = this.streams.get(activeStreamKey);
      if (stream) stream.activate();
    }
  }

  fileStart(_, name) { this.stream({ base: name }); }
  exampleStart(_, example = {}) { this.stream(example).start(process.hrtime.bigint()); }

  contextEnd(_, context = {}) { this.stream(context).depth--; }
  fileEnd(_, name) { this.endStream(name); }

  contextStart(_, context = { kind: '' }) {
    let description = context.description;
    if (context.kind[0] === 'X') {
      this.pendingTotal++;
      description = ansi.light(ansi.yellow(context.description));
    }
    const stream = this.stream(context);
    stream.depth++;

    stream.write('  '.repeat(stream.depth) + description + '\n');
  }

  exampleEnd(_, example = {}) {
    const stream = this.stream(example);
    const end = process.hrtime.bigint();
    let start = stream.exampleStart || end;

    let line = '  '.repeat(stream.depth + 1);

    if (example.kind === 'pending') {
      this.pendingTotal++;
      line += ansi.yellow('·· ') + ansi.light(example.description || '');
      stream.write(line + '\n');
      return;
    }

    let duration = Number((end - start) / MILLION);

    if (example.failure) {
      this.failures.push(example);
    }
    this.total++;

    if (example.failure) {
      line += ansi.cross + this.failures.length + ') ';
    } else {
      line += ansi.tick;
    }
    line += ansi.light(example.description || '');
    if (example.timeout && duration > 2 * example.timeout / 3) line += ansi.light(ansi.red(' {' + duration + 'ms}'));
    else if (example.timeout && duration > example.timeout / 3) line += ansi.light(ansi.yellow(' {' + duration + 'ms}'));

    stream.write(line + '\n');
  }

  contextLevelFailure(_, exampleOrContext = {}) {
    const stream = this.stream(exampleOrContext);
    this.failures.push(exampleOrContext);

    stream.write('  '.repeat(this.depth + 1) +
      ansi.cross + this.failures.length + ') ' +
      ansi.light(exampleOrContext.description) + '\n');
  }

  runEnd(executor) {
    super.runEnd(executor);
    this.timing.end = process.hrtime.bigint();
    process.stdout.write('\n\n');

    this.failures.forEach((example, index) => {
      process.stdout.write(
        (index + 1).toString().padStart(3, ' ') + ')' + example.fullDescription + '\n');

      if (example.failure.constructor.name === 'AssertionError') {
        process.stdout.write(ansi.red('     ' + example.failure.message.trimRight()) + '\n\n');
        let stack = example.failure.stack;
        if (stack.includes(example.failure.message)) {
          stack = stack.slice(stack.indexOf(example.failure.message) + example.failure.message.length);
        }
        stack = stack.replace(/^.*\n/, '');

        process.stdout.write(ansi.light(stack) + '\n');
      } else {
        const stack = example.failure.stack.split('\n');
        process.stdout.write(ansi.red('     ' + stack.shift()) + '\n\n');
        process.stdout.write(ansi.light(stack.join('\n')) + '\n');
      }
      if (example.failure.expected && example.failure.actual) {
        process.stdout.write('    ' + ansi.red(' - Actual ') + ansi.green(' + Expected') + '\n\n');
        process.stdout.write(differ(example.failure.expected, example.failure.actual).join('') + '\n');
      }
      process.stdout.write('\n');
    });
    process.stdout.write('\n');

    let summary = '';
    summary += `${this.total} example`;
    let col = 'green';
    if (this.total !== 1) { summary += 's'; }

    if (this.pendingTotal) {
      col = 'yellow';
      summary += `, ${this.pendingTotal} pending`;
    }

    if (this.failures.length) { col = 'red'; }
    summary += `, ${this.failures.length} failure`;
    if (this.failures.length !== 1) { summary += 's'; }

    process.stdout.write(ansi[col](summary) + ansi.light(` (in ${this.time})\n\n`));

    if(executor.settings.random) process.stdout.write(`Randomised with seed: ${executor.settings.seed}\n\n`);

    if (this.failures.length) {
      let headerDone;
      this.failures.forEach(({ location = null, fullDescription = '' }) => {
        if (location) {
          if (!headerDone) {
            headerDone = true;
            process.stdout.write('Failed examples:\n');
          }
          process.stdout.write(ansi.red(`  jsspec ${location}`) + ansi.blue(` #${fullDescription}\n`));
        }
      });
    }
  }

  get time() {
    let total = Number((this.timing.end - this.timing.start) / MILLION);
    if (total < 1000) return total + 'ms';
    return (total / 1000) + 's';
  }
}

const prefix = (prefix, str) => {
  let lines = str.split('\n').join('\n' + prefix);
  if (lines.endsWith('\n' + prefix)) lines = lines.slice(0, -prefix.length);
  else lines += '\n';
  return prefix + lines;
};

function differ(expected, actual) {
  let blocks = diff.diffJson(expected, actual);

  return blocks.map(block => {
    if (block.added) {
      return ansi.red(prefix(' - ', block.value));
    }
    if (block.removed) {
      return ansi.green(prefix(' + ', block.value));
    }
    return ansi.light(prefix('   ', block.value));
  });
}

module.exports = Documentation;

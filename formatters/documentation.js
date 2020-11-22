'use strict';
const diff = require('diff');
const path = require('path');

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
    return this;
  }

  start() {
    this.exampleStart = process.hrtime.bigint();
  }
}

const ACTIVE_STREAM = Symbol.for('active stream');

class Streams extends Map {
  constructor(...args) {
    super(...args);
    this.ordered = [];
  }

  get(name) {
    let stream = super.get(name);
    if (!stream) {
      stream = new TargetStream();
      this.ordered.push(stream);
      this.set(name, stream);
      this.active;
    }
    return stream;
  }

  get active() {
    let stream;
    while (stream = this.ordered[0]) {
      stream.activate();
      if (stream.closed) this.ordered.shift();
      else return stream;
    }
  }

  close(name = ACTIVE_STREAM) {
    if (name === ACTIVE_STREAM || this.get(name).close().active) {
      this.ordered.shift();
      this.delete(name);
      this.active;
    }
  }
}

class Documentation extends Null {
  static get description() {
    return 'Documentation style reporter';
  }

  constructor(emitter) {
    super(emitter);
    this.timing = { start: process.hrtime.bigint() };
    this.streams = new Streams();
    this.failures = [];
    this.total = 0;
    this.pendingTotal = 0;
    this.cwd = process.cwd();
  }

  fileStart(_, name) { this.streams.get(name); }
  exampleStart(_, example) { this.streams.get(example.base).start(); }

  contextEnd(_, context) { this.streams.get(context.base).depth--; }
  fileEnd(_, name) { this.streams.close(name); }

  contextStart(_, context) {
    let description = context.description;
    if (context.kind[0] === 'X') {
      this.pendingTotal++;
      description = ansi.light(ansi.yellow(context.description));
    }
    const stream = this.streams.get(context.base);
    stream.depth++;

    stream.write('  '.repeat(stream.depth) + description + '\n');
  }

  exampleEnd(_, example) {
    const stream = this.streams.get(example.base);
    const end = process.hrtime.bigint();
    let start = stream.exampleStart || end;

    let line = '  '.repeat(stream.depth + 1);

    if (example.kind === 'pending') {
      this.pendingTotal++;
      line += ansi.yellow('·· ') + ansi.light(example.description);
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

  contextLevelFailure(_, exampleOrContext) {
    this.failures.push(exampleOrContext);

    this.streams
      .get(exampleOrContext.base)
      .write('  '.repeat(this.depth + 1) +
        ansi.cross + this.failures.length + ') ' +
        ansi.light(exampleOrContext.description) + '\n');
  }

  runEnd(executor) {
    while (this.streams.active) { this.streams.close(); }

    super.runEnd(executor);
    this.timing.end = process.hrtime.bigint();
    process.stdout.write('\n\n');

    this.failures.forEach((example, index) => {
      process.stdout.write(
        (index + 1).toString().padStart(3, ' ') + ') ' + example.fullDescription + '\n');

      if (example.failure.constructor.name === 'AssertionError') {
        process.stdout.write(ansi.red('     ' + example.failure.message.trimRight()) + '\n\n');
        let stack = example.failure.stack || '';
        if (stack.includes(example.failure.message)) {
          stack = stack.slice(stack.indexOf(example.failure.message) + example.failure.message.length);
        }
        stack = stack.replace(/^.*\n/, '');

        process.stdout.write(ansi.light(stack) + '\n');
      } else if (example.failure.stack) {
        const stack = example.failure.stack.split('\n');
        process.stdout.write(ansi.red('     ' + stack.shift()) + '\n\n');
        process.stdout.write(ansi.light(stack.join('\n')) + '\n');
      } else if (example.failure.message) {
        process.stdout.write(ansi.red('     ' + example.failure.message.trimRight()) + '\n\n');
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

    if (executor && executor.settings && executor.settings.random)
      process.stdout.write(`Randomised with seed: ${executor.settings.seed}\n\n`);

    if (this.failures.length) {
      let headerDone;

      let command = "jsspec ";
      if (executor && executor.settings && executor.settings.require && executor.settings.require.length) {
        command += '-r ' + executor.settings.require.join(' ') + ' -- ';
      }
      this.failures.forEach(({ location = null, fullDescription = '' }) => {
        if (location) {
          if (!headerDone) {
            headerDone = true;
            process.stdout.write('Failed examples:\n');
          }
          process.stdout.write(ansi.red(`  ${command}${path.relative(this.cwd, location)}`) + ansi.blue(` # ${fullDescription}\n`));
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
  let blocks;
  if(typeof expected === 'function') {
    if(typeof actual !== 'function') blocks = diff.diffJson(`[function ${expected.name}]`, actual);
    else return [ansi.red(prefix(' - ', `[function ${expected.name}]`)), ansi.green(prefix(' + ', `[function ${actual.name}]`))];
  } else if (typeof actual === 'function') blocks = diff.diffJson(expected, `[function ${actual.name}]`)
  else blocks = diff.diffJson(expected, actual);

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

'use strict';
const diff = require('diff');
const MILLION = BigInt(1000000);

const Null = require('./null');

const ansi = require('../lib/ansi');

class Documentation extends Null {
  static get description() {
    return 'Documentation style reporter';
  }

  constructor(emitter) {
    super(emitter);
    this.timing = { start: process.hrtime.bigint() };
    this.pendingContexts = {};
    this.examples = {};
    this.failures = [];
    this.waitingFor = null;
    this.total = 0;
    this.depth = 0;
    this.stack = [];
    this.pendingTotal = 0;
  }

  contextStart(_, id, contextType = '', description) {
    this.pendingContexts[id] = { contextType, description, kind: 'context' };
    if (contextType[0] === 'X') {
      this.pendingTotal ++;
      description = ansi.light(ansi.yellow(description));
    }
    this.depth++;
    console.log('  '.repeat(this.depth) + description);
  }

  contextEnd() {
    this.depth--;
  }
  exampleStart() {
    this.stack.push(process.hrtime.bigint());
  }

  exampleEnd(_, example = {}) {
    let line = '  '.repeat(this.depth + 1);

    if ( example.constructor.name.startsWith('X') ){
      this.pendingTotal ++;
      line += ansi.yellow('·· ') + ansi.light(example.description || '');
      console.log(line);
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
      line += ansi.cross + this.failures.length + ') ';
    } else {
      line += ansi.tick;
    }
    line += ansi.light(example.description || '');
    if (duration > 200) line += ansi.light(ansi.red(' {' + duration + 'ms}'));

    console.log(line);
  }

  runEnd(executor) {
    super.runEnd(executor);
    this.timing.end = process.hrtime.bigint();
    console.log('');
    console.log('');

    this.failures.map((example, index) => {
      console.log((index + 1).toString().padStart(3, ' ') + ')' + example.fullDescription);

      if (example.failure.constructor.name === 'AssertionError'){
        console.log(ansi.red('     ' + example.failure.message) + '\n');
        const stack = example.failure.stack.split('\n');
        stack.shift();
        
        console.log(ansi.light(stack.join('\n')));
      }
      else
        console.log(ansi.light(example.failure.stack));
      if (example.failure.expected && example.failure.actual) {
        console.log('    ' + ansi.red(' - Actual ') + ansi.green(' + Expected') + '\n');
        console.log(differ(example.failure.expected, example.failure.actual).join(''));
        console.log('');
      }
    });
    console.log('');

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

    console.log(ansi[col](summary) + ansi.light(` (in ${this.time})`));
    console.log('');
    if (this.failures.length) {
      console.log('Failed examples:');
      this.failures.forEach(failure => {
        console.log(ansi.red(`  jsspec ${failure.location}`) + ansi.blue(` #${failure.fullDescription}`));
      });
    }
  }

  get time() {
    let total = Number((this.timing.end - this.timing.start) / MILLION);
    if (total < 1000) return total + 'ms';
    return (total / 1000) + 's';
  }
}

const prefix = (pfx, str) => {
  let lines = str.split('\n').join('\n' + pfx);
  if (lines.endsWith('\n' + pfx)) lines = lines.slice(0, -pfx.length);
  else(lines += '\n');
  return pfx + lines;
};

function differ(expected, actual) {
  let blocks = diff.diffJson(expected.toString(), actual.toString());

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

'use strict';
const diff = require('diff');
const THOUSAND = BigInt(1000);
const THOUSAND_DECIMAL = 1000.0;

const Null = require('./null');

const ansi = require('../lib/ansi');

const tidy = reports => reports
  .filter(report => 'bigint' != typeof report);

class Record {
  constructor() {
    this.results = [];
    this.start();
  }
  start() {
    this._start = process.hrtime.bigint();
  }
  addExample(example) {
    const time = Number((process.hrtime.bigint() - this._start) / THOUSAND) / THOUSAND_DECIMAL;
    const status = example.kind === 'pending' ? 'pending' : example.failure ? 'failed' : 'success';

    const { base, id, ...json } = { time, status, ...(example.toJSON ? example.toJSON() : example) };
    this.results.push(json);
  }
  addError(error) {
    const { base, id, ...json } = { status: "error", ...(error.toJSON ? error.toJSON() : error) }
    this.results.push(json);
  }

  close(name) {
    this.name = name;
  }
  toJSON() {
    return { name: this.name, results: this.results };
  }
}

class Json extends Null {
  static get description() { return 'JSON reporter'; }

  constructor(executor) {
    super(executor);
    this.watching = executor && executor.settings && executor.settings.watch;
    this.files = new Map();
  }

  fileStart(key) {
    this.files.set(key, new Record());
  }

  fileEnd(key, name) {
    const record = this.files.get(key);
    record.close(name);
    if (this.watching) console.log(JSON.stringify(record));
  }

  exampleStart(_, example) {
    this.files.get(example.base).start();
  }

  exampleEnd(executor, example) {
    this.files.get(example.base).addExample(example);
  }

  contextLevelFailure(_, exampleOrContext) {
    this.files.get(exampleOrContext.base).addError(exampleOrContext);
  }

  runEnd(executor) {
    super.runEnd(executor);

    if (!this.watching) console.log(JSON.stringify(Array.from(this.files.values())));
  }
}

module.exports = Json;

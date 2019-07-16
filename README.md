# @jsspec/format
[![Travis](https://img.shields.io/travis/jsspec/format/master.svg?logo=travis&style=for-the-badge)](https://travis-ci.org/jsspec/format)
[![AppVeyor](https://img.shields.io/appveyor/ci/HookyQR/format/master.svg?logo=appveyor&style=for-the-badge)](https://ci.appveyor.com/project/HookyQR/format)

Default reporter formatters for jsspec.

```javascript
class MyFormatter {
  static get description() { return 'I write stuff to the screen'; }
  constructor(specRunner){}
}
```

subscribe to specRunner events:
```javascript
  specRunner.on('fileStart' (specRunner, absoluteFilename) => {});
  specRunner.on('fileEnd' (specRunner, absoluteFilename) => {});
  specRunner.on('contextStart' (specRunner, id, contextType, description) => {});
  specRunner.on('contextEnd' (specRunner, id) => {});
  specRunner.on('exampleStart' (specRunner, example) => {});
  specRunner.on('exampleEnd' (specRunner, example) => {});
  specRunner.on('contextLevelFailure' (specRunner, exampleOrContext) => {});
  specRunner.on('runEnd' (specRunner) => {});
```

`specRunner` responds to `.context` and `.example`

`context` is an instance of `Context`:
```javascript
context.parent // a context
context.children // [context/example] <- only those loaded so far
context.description // the description supplied 
context.initialisedBy // string: 'context' || 'describe'
```
`example` is an instance of `Example` and responds to:
`kind` with:
```javascript
"pending" // the block won't be run in this case
"it"
"after" // after hooks fall outside of the `it` block execution
```

and `failure`:
An exception, which was either thrown by the system, or an `ExpectationFailure` which includes the following additional information:
```javascript
expected
actual
```

Formatters included:
## `Null`
Does nothing. Use with `--format null`. Can be used as a base class to create other formatters.

## `Documentation`
`-fd` or `--format documentation`. Presents a tree of execution results with checks and crosses for example results. A summary of failures are provided at the end.

## `Dot`
`-fo` or `--format dot`. Single character output per test. With summary at the end.

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
  specRunner.on('fileStart' (specRunner, uniqueFileRunReference) => {});
  specRunner.on('fileEnd' (specRunner, uniqueFileRunReference) => {});
  specRunner.on('contextStart' (specRunner, context) => {});
  specRunner.on('contextEnd' (specRunner, context) => {});
  specRunner.on('exampleStart' (specRunner, example) => {});
  specRunner.on('exampleEnd' (specRunner, example) => {});
  specRunner.on('contextLevelFailure' (specRunner, exampleOrContext) => {});
  specRunner.on('runEnd' (specRunner) => {});
```

`context`, `example` and `exampleOrContext` each respond to the following:
```javascript
id // [For a conetxt only] a unique name for this context
description // the description supplied 
fullDescription // the description, with all context descriptions pre-pended
kind // the class name of the object
base // a uniq name relating to this spec file run
failure // which may be (hopefully) undefined
```

`failure` is either an exception, or an exception converted to an object, depending on how `JSSpec` was run. It will have the following attributes:
```javascript
constructor.name
stack
message
expected // may be empty
actual // may be empty
```

Formatters included:
## `Null`
Does nothing. Use with `--format null`. Can be used as a base class to create other formatters.

## `Documentation`
`-fd` or `--format documentation`. Presents a tree of execution results with checks and crosses for example results. A summary of failures are provided at the end.

## `Dot`
`-fo` or `--format dot`. Single character output per test. With summary at the end.

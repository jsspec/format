# @jsspec/format
[![Travis (.org) branch](https://img.shields.io/travis/jsspec/format/master.svg?logo=travis&style=for-the-badge)](https://travis-ci.org/jsspec/format)
[![AppVeyor](https://img.shields.io/appveyor/ci/HookyQR/format/master.svg?logo=appveyor&style=for-the-badge)](https://ci.appveyor.com/project/HookyQR/format)

Default reporter formatters for jsspec

```javascript
class MyFormatter {
  static get description() { return 'I write stuff to the screen'; }
  constructor(specRunner){}
}
```

subscribe to specRunner events:
```javascript
  specRunner.on('fileStart' (absoluteFilename) => {});
  specRunner.on('fileEnd' (absoluteFilename) => {});
  specRunner.on('contextStart' (context) => {});
  specRunner.on('contextEnd' (context) => {});
  specRunner.on('exampleStart' (example) => {});
  specRunner.on('exampleEnd' (example) => {});
  specRunner.on('runEnd' () => {});
```

`context` is an instance of `Context`:
```javascript
context.parent // a context
context.children // [context/example] <- only those loaded so far
context.description // the description supplied 
context.initialisedBy // string: 'context' || 'describe'
```
`exampleType` is one of:
```javascript
"it"
"before"
"beforeEach"
"afterEach"
"after"
```

`failure` is:
An exception, which was either thrown by the system, or an `ExpectationFailure` which includes the following additional information:
```javascript
description
expected
actual
```

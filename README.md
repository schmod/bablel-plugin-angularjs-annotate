# babel-plugin-angularjs-annotate

[![Circle CI](https://circleci.com/gh/schmod/babel-plugin-angularjs-annotate.svg?style=svg)](https://circleci.com/gh/schmod/babel-plugin-angularjs-annotate) [![npm version](https://badge.fury.io/js/babel-plugin-angularjs-annotate.svg)](https://badge.fury.io/js/babel-plugin-angularjs-annotate)

Fork of [ng-annotate](https://github.com/olov/ng-annotate) for Babel users, with a focus on speed and ES6 support.

Adds Angular 1.x DI annotations to ES5/ES6 code being processed by Babel, with support for explicit annotations (`/* @ngInject */`), and automatic (implicit) annotation of typical Angular code patterns.

Fully compatible with ES5, transpiled ES6, and raw ES6 sources.  Offers significantly reduced build times for projects already using Babel, compared to the standalone ng-annotate tool.

This plugin currently supports matching and transforming all of the patterns currently recognized by ng-annotate (explicit and implicit), and passes the relevant portions of ng-annotate's test suite.

## Installation

Use like any other [Babel plugin](https://babeljs.io/docs/plugins/).  

Most users will want to run

```sh
$ npm install babel-plugin-angularjs-annotate --save-dev
```

and add the plugin to your `.babelrc` file:

```json
{
  "presets": ["es2015"],
  "plugins": ["angularjs-annotate"]
}
```

## Options

### `explicitOnly`

By default, this plugin will attempt to add annotations to common AngularJS code patterns.  This behavior can be disabled (requiring you to mark up functions with `/* @ngInject */` or `'ngInject'`).

To pass this option to the plugin, [add it to your Babel configuration](https://babeljs.io/docs/plugins/#plugin-options):

```json
{
  "presets": ["es2015"],
  "plugins": [["angularjs-annotate", { "explicitOnly" : true}]]
}
```

## Usage

See [ng-annotate](https://github.com/olov/ng-annotate)'s documentation and the [test sources](tests/) for details about the patterns that can be automatically detected by ng-annotate and this plugin, as well as information about how to explicitly mark functions and classes for annotation.

[Try it out in your browser](http://schmod.github.io/babel-plugin-angularjs-annotate/).

### ES6 Annotations

This plugin can annotate some ES6 classes and arrow functions that are not supported by ng-annotate:

#### Implicit arrow function annotation

Arrow functions may be annotated anywhere that a "regular" function expression may be used.

**NOTE:** There are places where you _shouldn't_ use arrow functions in an Angular application.  Inside of an arrow function, the value of `this` is inherited from the lexical scope enclosing the function.  For this reason, arrow functions should not be used to declare Angular services or providers.  

_If you choose to ignore this warning, we'll add the annotations to your services and providers anyway, but your application probably won't work.  Future releases may treat this condition as an error._

```js
angular.module("MyMod").controller("MyCtrl", ($scope, $timeout) => {});
```

Becomes:

```js
angular.module("MyMod").controller("MyCtrl", ["$scope", "$timeout", ($scope, $timeout) => {}]);
```

#### Explicit arrow function annotation

Arrow functions may also be explicitly marked for annotation.

```js
var x = /* @ngInject */ ($scope) => {};
```

Becomes:

```js
var x = /* @ngInject */ ($scope) => {};
x.$inject = ["$scope"]
```

#### Implicit Class Annotation

If a class is declared as an Angular service or factory in the same file as it is declared, it will be annotated automatically:

```js
class svc {
    constructor(dep1){
        this.dep1 = dep1;
    }
}
angular.module('MyMod').service('MySvc', svc);
```

Becomes:

```js
class svc {
    constructor(dep1){
        this.dep1 = dep1;
    }
}
svc.$inject = ['dep1'];
angular.module('MyMod').service('MySvc', svc);
```

#### Explicit Class Annotation

If a class is exported and used in another file/module, it must be explicitly marked for injection:

```js
/* @ngInject */
class svc {
  constructor(dep1){
      this.dep1 = dep1;
  }
}
```

Prologue directives may also be used here:

```js
class svc {
  constructor(dep1){
      "ngInject";
      this.dep1 = dep1;
  }
}
```


#### Object Method Shorthand

Object methods can be written with the new [shorthand](http://exploringjs.com/es6/ch_oop-besides-classes.html#object-literal-method-definitions) syntax:

```js
let foo = {
  bar($http){
    'ngInject';
  }
};
```

```js
$stateProvider.state('myState', {
  controller($scope) {}
});
```

#### Exports

Exported functions and classes may be annotated.  Exported functions must have names:

```js
/* @ngInject */
export default function svc(dep1){}
```

## Notes & Philosophy

This project/experiment does _not_ seek to replace ng-annotate.  However, it does seek to provide similar
functionality for Angular 1.x developers who are already using Babel and/or writing code in ES6.

Because of some of the limitations presented by Babel's transformation process, this project does not aim to
achieve feature parity, or provide identical output to ng-annotate. Notably, Babel does not preserve formatting
and indentations like ng-annotate does, and this project does not seek to replicate the features of ng-annotate that remove or transform existing annotations.

Initially, I had hoped to make very few modifications to the upstream sources, in the hopes of eventually
merging babel support directly into ng-annotate.  Unfortunately, Babylon appears to have diverged too
far from Acorn to make that goal realistic.  (I would love to be wrong here, and would welcome contributions that close the gap between the two projects!)

### Building

For Node legacy compatibility, all code is transpiled to ES5 via Babel, to build just run:
```
npm run build
```

### To run tests:

```
npm test
```


## License
`MIT`, see [LICENSE](LICENSE) file.

This project is a fork of [ng-annotate](https://github.com/olov/ng-annotate), which  was written by [Olov Lassus](https://github.com/olov) with the kind help by
[contributors](https://github.com/olov/ng-annotate/graphs/contributors).
[Follow @olov](https://twitter.com/olov) on Twitter for updates about ng-annotate.

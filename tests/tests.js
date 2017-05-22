'use strict';

const babel = require('babel-core');
const diff = require('diff');
const chalk = require('chalk');
const indent = require('indent-string');
const tape = require('tape').test;
const path = require('path');

const resolve = (file) => path.resolve(__dirname, file);

const ES6presets = [resolve("./es2015-modified")];
const plugin = resolve("../dist/babel-ng-annotate.js");

let suites = [
  require('./simple'),
  require('./simple-arrow'),
  require('./provider$get'),
  require('./inside_module'),
  require('./ui-router'),
  require('./modals'),
  require('./ngInject'),
  require('./ngInject-arrow'),
  require('./issues'),
  require('./references'),
  require('./es6.js')
];

function runSuite(suite){
  // console.log(chalk.bold("Running: " + suite.name));
  runTests(suite.tests);
}

function runTests(tests){
  tests.forEach(test => {
    if(test.contextDependent){
      runTests([{
        name: test.name + " - Inside Module",
        input: wrapInAngularModule(test.input),
        expected: wrapInAngularModule(test.expected)
      }, {
        name: test.name + " - Outside Module",
        input: wrapInNonAngularContext(test.input),
        expected: wrapInNonAngularContext(test.input)
      }])
    } else {
      runTest(test);
    }
  });
}

function runTest(test) {
  tape(function(t){
    // es2015 tansforms disabled because circleCI's node/npm won't let us hack out the function name transformation
    // var out = babel.transform(fnBody(test.input),  { plugins: "../babel-ng-annotate", presets: ["../es2015-modified"] });
    // var expected = babel.transform(fnBody(test.expected), { plugins: [], presets: ["../es2015-modified"] });

    // Test transpiled ES5 sources
    if(!test.noES5){
      doTransform(t, test, ES6presets, 'ES5');
    }

    // And again without the ES6 transformations
    if(!test.noES6){
      doTransform(t, test, [], 'ES2015');
    }

    t.end();
  });

  // if(out.code.trim() != expected.code.trim()){
  //   console.warn("  " + test.name + ": " + chalk.red.bold("FAILED."));
  //   printDiff(expected.code, out.code)
  // } else {
  //   console.log("  " + test.name + ": " + chalk.green.bold("PASSED."));
  // }
}

function doTransform(t, test, presets, logPrefix){

  let out = babel.transform(fnBody(test.input),  { plugins: [plugin], presets: presets });
  let expected = babel.transform(fnBody(test.expected), { plugins: [], presets: presets });

  t.equals(out.code.trim().replace(/\n/g,''), expected.code.trim().replace(/\n/g,''), logPrefix + ': ' + test.name);

  // If test is marked as explicit, it should still work when explicitOnly is on
  if(test.explicit){
    out = babel.transform(fnBody(test.input),  { plugins: [[plugin, {explicitOnly: true}]], presets:presets });

    t.equals(out.code.trim().replace(/\n/g,''), expected.code.trim().replace(/\n/g,''), logPrefix + ' explicitOnly: ' + test.name);
  }

  // If test is marked as implicit, no transformation should occur when explicitOnly is on
  if(test.implicit){
    out = babel.transform(fnBody(test.input),  { plugins: [[plugin, {explicitOnly: true}]], presets: presets });
    expected = babel.transform(fnBody(test.input), { plugins: [], presets: presets });

    t.equals(out.code.trim().replace(/\n/g,''), expected.code.trim().replace(/\n/g,''), logPrefix + 'explicitOnly: ' + test.name);
  }

}

function fnBody(fn){
  if(typeof fn === 'function'){
    return fn.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1];
  } else {
    return fn;
  }
}

function wrapInAngularModule(fn){
  var prefix = "angular.module(\"MyMod\").directive(\"pleasematchthis\", function() {\n";
  var suffix = "\n});"
  return eval(Function(prefix + fnBody(fn) + suffix));
}

function wrapInNonAngularContext(fn){
  var prefix = "foobar.irrespective(\"dontmatchthis\", function() {\n";
  var suffix = "\n});"
  return eval(Function(prefix + fnBody(fn) + suffix));
}

function printDiff(expected, actual){
  var delta = diff.diffLines(expected, actual, {ignoreWhitespace: true});
  let msg = delta.map(part => {
    let msg = indent(part.value.trim(), " ", 6) + '\n';
    if(part.removed){
      msg = chalk.red("-" + msg);
    } else if(part.added) {
      msg = chalk.green("+" + msg);
    } else {
      msg = chalk.gray(msg);
    }
    return msg;
  }).reduce((memo, val) => memo + val, "");
  console.warn(msg);

  // console.warn(chalk.bold("GOT:") + "\n" + actual);
  // console.warn(chalk.bold("WANTED:") + "\n" + expected + '\n');
}

suites.forEach(runSuite);

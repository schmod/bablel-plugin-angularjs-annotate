'use strict';

var ngAnnotate = require('./ng-annotate-main');
const ngInject = require('./nginject');
const is = require('simple-is');

const match = ngAnnotate.match;
const addModuleContextDependentSuspect = ngAnnotate.addModuleContextDependentSuspect;
const addModuleContextIndependentSuspect = ngAnnotate.addModuleContextIndependentSuspect;
const judgeSuspects = ngAnnotate.judgeSuspects;
const matchDirectiveReturnObject = ngAnnotate.matchDirectiveReturnObject;
const matchProviderGet = ngAnnotate.matchProviderGet;


module.exports = function() {

    var options = {};

    const re = (options.regexp ? new RegExp(options.regexp) : /^[a-zA-Z0-9_\$\.\s]+$/);

    // suspects is built up with suspect nodes by match.
    // A suspect node will get annotations added / removed if it
    // fulfills the arrayexpression or functionexpression look,
    // and if it is in the correct context (inside an angular
    // module definition)
    const suspects = [];

    // blocked is an array of blocked suspects. Any target node
    // (final, i.e. IIFE-jumped, reference-followed and such) included
    // in blocked will be ignored by judgeSuspects
    const blocked = [];

    const ctx = {
        re: re,
        suspects: suspects,
        blocked: blocked,
        addModuleContextDependentSuspect: addModuleContextDependentSuspect,
        addModuleContextIndependentSuspect: addModuleContextIndependentSuspect
    };

  var addTargets = function(targets) {
    if (!targets) {
        return;
    }
    if (!is.array(targets)) {
        targets = [targets];
    }

    for (let i = 0; i < targets.length; i++) {
        addModuleContextDependentSuspect(targets[i], ctx);
    }
  };

  return {
    visitor: {
      AssignmentExpression: {
        enter(path) {
          ngInject.inspectAssignment(path, ctx);
        },
        exit(path, state) {
          if(!state.opts.explicitOnly){
            let targets = matchProviderGet(path);
            addTargets(targets);
          }
        }
      },
      VariableDeclarator: {
        enter(path) {
          ngInject.inspectDeclarator(path, ctx);
        }
      },
      ClassDeclaration: {
        enter(path) {
          ngInject.inspectClassDeclaration(path, ctx);
        }
      },
      ClassMethod: {
        enter(path) {
          ngInject.inspectClassMethod(path, ctx);
        }
      },
      ObjectExpression: {
        enter(path) {
          ngInject.inspectObjectExpression(path, ctx);
        },
        exit(path, state) {
          if(!state.opts.explicitOnly){
            let targets = matchProviderGet(path);
            addTargets(targets);
          }
        }
      },
      ReturnStatement: {
        exit(path, state) {
          if(!state.opts.explicitOnly){
            let targets = matchDirectiveReturnObject(path);
            addTargets(targets);
          }
        }
      },
      FunctionExpression: {
        enter(path) {
          ngInject.inspectFunction(path, ctx);
        }
      },
      ArrowFunctionExpression: {
        enter(path) {
          ngInject.inspectFunction(path, ctx);
        }
      },
      FunctionDeclaration: {
        enter(path) {
          ngInject.inspectFunction(path, ctx);
        }
      },
      ObjectMethod: {
        enter(path) {
          ngInject.inspectFunction(path, ctx);
        }
      },
      CallExpression: {
        enter(path) {
          ngInject.inspectCallExpression(path, ctx);
        },
        exit(path, state) {
            let targets = match(path, ctx, state.opts.explicitOnly);
            addTargets(targets);
        }
      },
      ExportDeclaration: {
        enter(path) {
          ngInject.inspectExportDeclaration(path, ctx);
        }
      },
      Program: {
        enter(path, file) {
          file.opts.explicitOnly = file.opts.explicitOnly || false;

          ctx.suspects = [];
          ctx.blocked = [];
          ctx.fragments = [];

          ctx.srcForRange = function(node) {
            return file.file.code.slice(node.start, node.end);
          };
        },
        exit() {
          judgeSuspects(ctx);
        }
      }
    }
  };
}

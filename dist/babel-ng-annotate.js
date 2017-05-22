'use strict';

var ngAnnotate = require('./ng-annotate-main');
var ngInject = require('./nginject');
var is = require('simple-is');

var match = ngAnnotate.match;
var addModuleContextDependentSuspect = ngAnnotate.addModuleContextDependentSuspect;
var addModuleContextIndependentSuspect = ngAnnotate.addModuleContextIndependentSuspect;
var judgeSuspects = ngAnnotate.judgeSuspects;
var matchDirectiveReturnObject = ngAnnotate.matchDirectiveReturnObject;
var matchProviderGet = ngAnnotate.matchProviderGet;

module.exports = function () {

  var options = {};

  var re = options.regexp ? new RegExp(options.regexp) : /^[a-zA-Z0-9_\$\.\s]+$/;

  // suspects is built up with suspect nodes by match.
  // A suspect node will get annotations added / removed if it
  // fulfills the arrayexpression or functionexpression look,
  // and if it is in the correct context (inside an angular
  // module definition)
  var suspects = [];

  // blocked is an array of blocked suspects. Any target node
  // (final, i.e. IIFE-jumped, reference-followed and such) included
  // in blocked will be ignored by judgeSuspects
  var blocked = [];

  var ctx = {
    re: re,
    suspects: suspects,
    blocked: blocked,
    addModuleContextDependentSuspect: addModuleContextDependentSuspect,
    addModuleContextIndependentSuspect: addModuleContextIndependentSuspect
  };

  var addTargets = function addTargets(targets) {
    if (!targets) {
      return;
    }
    if (!is.array(targets)) {
      targets = [targets];
    }

    for (var i = 0; i < targets.length; i++) {
      addModuleContextDependentSuspect(targets[i], ctx);
    }
  };

  return {
    visitor: {
      AssignmentExpression: {
        enter: function enter(path) {
          ngInject.inspectAssignment(path, ctx);
        },
        exit: function exit(path, state) {
          if (!state.opts.explicitOnly) {
            var targets = matchProviderGet(path);
            addTargets(targets);
          }
        }
      },
      VariableDeclarator: {
        enter: function enter(path) {
          ngInject.inspectDeclarator(path, ctx);
        }
      },
      ClassDeclaration: {
        enter: function enter(path) {
          ngInject.inspectClassDeclaration(path, ctx);
        }
      },
      ClassMethod: {
        enter: function enter(path) {
          ngInject.inspectClassMethod(path, ctx);
        }
      },
      ObjectExpression: {
        enter: function enter(path) {
          ngInject.inspectObjectExpression(path, ctx);
        },
        exit: function exit(path, state) {
          if (!state.opts.explicitOnly) {
            var targets = matchProviderGet(path);
            addTargets(targets);
          }
        }
      },
      ReturnStatement: {
        exit: function exit(path, state) {
          if (!state.opts.explicitOnly) {
            var targets = matchDirectiveReturnObject(path);
            addTargets(targets);
          }
        }
      },
      FunctionExpression: {
        enter: function enter(path) {
          ngInject.inspectFunction(path, ctx);
        }
      },
      ArrowFunctionExpression: {
        enter: function enter(path) {
          ngInject.inspectFunction(path, ctx);
        }
      },
      FunctionDeclaration: {
        enter: function enter(path) {
          ngInject.inspectFunction(path, ctx);
        }
      },
      ObjectMethod: {
        enter: function enter(path) {
          ngInject.inspectFunction(path, ctx);
        }
      },
      CallExpression: {
        enter: function enter(path) {
          ngInject.inspectCallExpression(path, ctx);
        },
        exit: function exit(path, state) {
          var targets = match(path, ctx, state.opts.explicitOnly);
          addTargets(targets);
        }
      },
      ExportDeclaration: {
        enter: function enter(path) {
          ngInject.inspectExportDeclaration(path, ctx);
        }
      },
      Program: {
        enter: function enter(path, file) {
          file.opts.explicitOnly = file.opts.explicitOnly || false;

          ctx.suspects = [];
          ctx.blocked = [];
          ctx.fragments = [];

          ctx.srcForRange = function (node) {
            return file.file.code.slice(node.start, node.end);
          };
        },
        exit: function exit() {
          judgeSuspects(ctx);
        }
      }
    }
  };
};
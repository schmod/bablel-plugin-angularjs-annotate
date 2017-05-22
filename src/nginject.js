// nginject.js
// MIT licensed, see LICENSE file
// Copyright (c) 2013-2016 Olov Lassus <olov.lassus@gmail.com>

"use strict";

const is = require("simple-is");
const t = require('babel-types');
const codeFrame = require("babel-code-frame");

module.exports = {
    inspectComment: inspectComment,
    inspectCallExpression: inspectCallExpression,
    inspectFunction: inspectFunction,
    inspectObjectExpression: inspectObjectExpression,
    inspectAssignment: inspectAssignment,
    inspectDeclarator: inspectDeclarator,
    inspectClassDeclaration: inspectClassDeclaration,
    inspectClassMethod: inspectClassMethod,
    inspectExportDeclaration: inspectExportDeclaration
};

function inspectCallExpression(path, ctx) {
    const node = path.node;
    const name = node.callee.name;
    if(inspectComment(path, ctx)){
      return false;
    }
    if (t.isIdentifier(node.callee) && (name === "ngInject" || name === "ngNoInject") && node.arguments.length === 1) {
        const block = (name === "ngNoInject");
        addSuspect(path.get("arguments")[0], ctx, block);
    }

    path.get("arguments").forEach(arg => {
      let annotation = getAnnotation(arg.node);
      if(!t.isIdentifier(arg) || annotation === null){
        return;
      }
      let binding = path.scope.getBinding(arg.node.name);
      if(binding){
        addSuspect(binding.path, ctx, !annotation);
      }
    });
}

function inspectFunction(path, ctx) {
    const node = path.node;

    if(t.isVariableDeclarator(path.parent) && t.isVariableDeclaration(path.parentPath.parent)){
      let annotation = getAnnotation(path.parentPath.parent);
      if(annotation === null){
        annotation = getAnnotation(node);
      }
      if(annotation !== null){
        addSuspect(path.parentPath.parentPath, ctx, !annotation);
        return;
      }
    }

    if(inspectComment(path, ctx)){
      return;
    }

    const annotate = matchPrologueDirectives(path);
    if (annotate === null) {
        return;
    }

    // now add the correct suspect

    // for function declarations, it is always the function declaration node itself
    if (t.isFunctionDeclaration(node)) {
        addSuspect(path, ctx, !annotate);
        return;
    }

    // node is a function expression below

    // case 1: a function expression which is the rhs of a variable declarator, such as
    // var f1 = function(a) {
    //     "ngInject"
    // };
    // in this case we can mark the declarator, same as saying var /*@ngInject*/ f1 = function(a) ..
    // or /*@ngInject*/ var f1 = function(a) ..
    // f1.$inject = ["a"]; will be added (or rebuilt/removed)
    if (t.isVariableDeclarator(path.parent)) {
        addSuspect(path.parentPath, ctx, !annotate);
        return;
    }

    // case 2: an anonymous function expression, such as
    // g(function(a) {
    //     "ngInject"
    // });
    //
    // the suspect is now its parent annotated array (if any), otherwise itself
    // there is a risk of false suspects here, in case the parent annotated array has nothing to do
    // with annotations. the risk should be very low and hopefully easy to workaround
    //
    // added/rebuilt/removed => g(["a", function(a) {
    //     "ngInject"
    // }]);
    const maybeArrayExpression = path.parentPath;
    if (isAnnotatedArray(maybeArrayExpression)) {
        addSuspect(maybeArrayExpression, ctx, !annotate);
    } else {
        addSuspect(path, ctx, !annotate);
    }
}

function inspectComment(path, ctx) {
  const node = path.node;

  let annotation = getAnnotation(node);
  if(annotation !== null){
    addSuspect(path, ctx, !annotation);
    return true;
  }
}

function getAnnotation(node){
  if(!node.leadingComments){
    return null;
  }

  for(var i=0; i<node.leadingComments.length; i++){
    let value = node.leadingComments[i].value.trim();

    if(value === "@ngInject"){
      return true;
    } else if (value === "@ngNoInject") {
      return false;
    }
  }

  return null;
}

function getAnnotations(nodes){
  for (var i = 0; i < nodes.length; i++){
    let annotation = getAnnotation(nodes[i]);
    if(annotation !== null){
      return annotation;
    }
  }
  return null;
}

function inspectObjectExpression(path, ctx) {
  const node = path.node;

  // to pick up annotations that should apply to all properties
  // ie. /*@ngAnnotate*/ {}
  var candidates = [node];

  if(t.isAssignmentExpression(path.parent)){
    candidates.unshift(path.parent);
    if(t.isExpressionStatement(path.parentPath.parent)){
      candidates.unshift(path.parentPath.parent);
    }
  }

  if(t.isVariableDeclarator(path.parent) && t.isVariableDeclaration(path.parentPath.parent)){
    candidates.unshift(path.parentPath.parent);
  }

  let annotateEverything = getAnnotations(candidates);
  if(annotateEverything !== null){
    addSuspect(path, ctx, !annotateEverything);
  } else {
    path.get("properties")
    .filter(prop => isFunctionExpressionOrArrow(prop.node.value))
    .forEach(prop => inspectComment(prop, ctx));
  }

  // path.get("properties").forEach(prop => {
  //   if(t.isObjectExpression(prop.node.value)){
  //     inspectObjectExpression(prop.get("value"), ctx);
  //     return;
  //   }

  //   let annotation = getAnnotation(prop.node);
  //   if(annotation !== null || annotateEverything !== null){
  //     let effectiveAnnotation = annotation === null ? annotateEverything : annotation;
  //     addSuspect(prop.get("value"), ctx, !effectiveAnnotation);
  //   }
  // });
}

function matchPrologueDirectives(path) {
    const prologueDirectives = ["ngInject", "ngNoInject"];
    const directives = path.node.body.directives || [];
    let matches = directives.map(dir => dir.value.value)
      .filter(val => prologueDirectives.indexOf(val) !== -1);

    if(matches.length){
      let match = matches[0].trim();
      if(match === "ngInject") return true;
      if(match === "ngNoInject") return false;
    }

    return null;
}

function inspectAssignment(path, ctx){
  const node = path.node;
  if(!isFunctionExpressionOrArrow(node.right)){
    return;
  }

  var candidates = [path.node, node.right];
  if(t.isExpressionStatement(path.parent)){
    candidates.unshift(path.parent);
    path = path.parentPath;
  }

  let annotation = getAnnotations(candidates);
  if(annotation !== null){
    addSuspect(path, ctx, !annotation);
  }
}

function inspectDeclarator(path, ctx){
  const node = path.node;
  if(!isFunctionExpressionOrArrow(node.init)){
    return;
  }

  var candidates = [node, node.init];
  if(t.isVariableDeclaration(path.parent)){
    path = path.parentPath;
  } else {
    console.error("not a variable declaration");
  }

  let annotation = getAnnotations(candidates);
  if(annotation !== null){
    addSuspect(path, ctx, !annotation);
  }
}

function inspectClassDeclaration(path, ctx){
  const node = path.node;
  let annotation = getAnnotation(node);
  if(annotation !== null){
    addSuspect(path, ctx, !annotation);
  }
}

function inspectClassMethod(path, ctx){
  const node = path.node;

  if(node.kind !== 'constructor'){
    return;
  }

  let annotation = getAnnotation(path.node);
  if(annotation === null){
    annotation = matchPrologueDirectives(path);
    if(annotation === null) {
      return;
    }
  }

  const ancestry = path.getAncestry();
  for(var i=0; i < ancestry.length; i++){
    let ancestor = ancestry[i];
    if(ancestor.isClassDeclaration()){
      addSuspect(ancestor, ctx, !annotation);
      return;
    }
  }
}

function inspectExportDeclaration(path, ctx){
  let annotation = getAnnotation(path.node);
  if(annotation === null){
    return;
  }
  addSuspect(path.get('declaration'), ctx, !annotation);
}

function isStringArray(node) {
    if (!t.isArrayExpression(node)) {
        return false;
    }
    return node.elements.length >= 1 && node.elements.every(function(n) {
        return t.isLiteral(n) && is.string(n.value);
    });
}

function findNextStatement(path) {
    const body = path.parentPath.get("body");
    for (let i = 0; i < body.length; i++) {
        if (body[i].path === path.node) {
            return body[i + 1] || null;
        }
    }
    return null;
}

function addSuspect(path, ctx, block) {
    const target = path.node;
    if (t.isExpressionStatement(target) && t.isAssignmentExpression(target.expression) && isStringArray(target.expression.right)) {
        // /*@ngInject*/
        // FooBar.$inject = ["$a", "$b"];
        // function FooBar($a, $b) {}
        const adjustedTarget = findNextStatement(path);
        if (adjustedTarget) {
            return addSuspect(adjustedTarget, ctx, block);
        }
    }

    if (t.isObjectExpression(path)) {
        // /*@ngInject*/ {f1: function(a), .., {f2: function(b)}}
        addObjectExpression(path, ctx);
    } else if (t.isAssignmentExpression(target) && t.isObjectExpression(target.right)) {
        // /*@ngInject*/ f(x.y = {f1: function(a), .., {f2: function(b)}})
        addObjectExpression(target.get("right"), ctx);
    } else if (t.isExpressionStatement(target) && t.isAssignmentExpression(target.expression) && t.isObjectExpression(target.expression.right)) {
        // /*@ngInject*/ x.y = {f1: function(a), .., {f2: function(b)}}
        addObjectExpression(target.get("expression.right"), ctx);
    } else if (t.isVariableDeclaration(target) && target.declarations.length === 1 && target.declarations[0].init && t.isObjectExpression(target.declarations[0].init)) {
        // /*@ngInject*/ var x = {f1: function(a), .., {f2: function(b)}}
        addObjectExpression(target.get("declarations")[0].get("init"), ctx);
    } else if (t.isProperty(target)) {
        // {/*@ngInject*/ justthisone: function(a), ..}
        let value = path.get("value");
        value.$limitToMethodName = "*never*";
        addOrBlock(value, ctx);
    } else {
        // /*@ngInject*/ function(a) {}
        path.$limitToMethodName = "*never*";
        addOrBlock(path, ctx);
    }


    function addObjectExpression(path, ctx) {
        nestedObjectValues(path).forEach(function(n) {
            n.$limitToMethodName = "*never*";
            addOrBlock(n, ctx);
        });
    }

    function addOrBlock(path, ctx) {
        if (block) {
            ctx.blocked.push(path);
        } else {
            ctx.addModuleContextIndependentSuspect(path, ctx)
        }
    }
}

function nestedObjectValues(path, res) {
    res = res || [];

    path.get("properties").forEach(function(prop) {
        const v = prop.get("value");
        if (isFunctionExpressionOrArrow(v) || t.isArrayExpression(v)) {
            res.push(v);
        } else if (t.isObjectExpression(v)) {
            nestedObjectValues(v, res);
        }
    });

    return res;
}

function isAnnotatedArray(path) {
    if (!t.isArrayExpression(path)) {
        return false;
    }
    const elements = path.get('elements');

    // last should be a function expression
    let fn = elements.slice(-1)[0];
    if (elements.length === 0 || !isFunctionExpressionOrArrow(fn)) {
        return false;
    }

    var fnParams = fn.node.params.map(param => param.name);
    if(fnParams.length > elements.length - 1){
      throw path.buildCodeFrameError("[angularjs-annotate] ERROR: Function parameters do not match existing annotations.");
    }

    var warnedOnce = false;
    // all but last should be string literals
    for (let i = 0; i < elements.length - 1; i++) {
        const n = elements[i];
        if (!t.isLiteral(n) || !is.string(n.node.value)) {
            return false;
        }

        if (!warnedOnce && fnParams[i] && n.node.value !== fnParams[i]) {
          warnedOnce = true;
          var frame = codeFrame(n.hub.file.code, n.node.loc.start.line, n.node.loc.start.column + 2);
          console.warn("[angularjs-annotate] WARN: Function parameters do not match existing annotations.\n" + frame);
        }
    }

    return true;
}

function isFunctionExpressionOrArrow(node) {
    return t.isFunctionExpression(node) || t.isArrowFunctionExpression(node);
}

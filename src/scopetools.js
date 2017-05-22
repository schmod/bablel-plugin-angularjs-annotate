// scopetools.js
// MIT licensed, see LICENSE file
// Copyright (c) 2013-2016 Olov Lassus <olov.lassus@gmail.com>

"use strict";

const is = require("simple-is");
const t = require("babel-types");

module.exports = {
    isReference: isReference
};

function isFunction(node) {
    return t.isFunctionDeclaration(node) || t.isFunctionExpression(node);
}

function isReference(path) {
    const node = path.node;
    const parent = path.parent;
    return node.$refToScope ||
        t.isIdentifier(node) &&
            !(t.isVariableDeclarator(parent) && parent.id === node) && // var|let|const $
            !(t.isMemberExpression(parent) && parent.computed === false && parent.property === node) && // obj.$
            !(t.isProperty(parent) && parent.key === node) && // {$: ...}
            !(t.isLabeledStatement(parent) && parent.label === node) && // $: ...
            !(t.isCatchClause(parent) && parent.param === node) && // catch($)
            !(isFunction(parent) && parent.id === node) && // function $(..
            !(isFunction(parent) && is.someof(node, parent.params)) && // function f($)..
            true;
}

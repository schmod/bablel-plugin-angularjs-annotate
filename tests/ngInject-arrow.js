module.exports = {
  name: "Explicit ngInject annotations with arrow functions",
  tests: [
    {
      name: "var x = /* @ngInject */ function($scope)",
      input: function(){
        var x = /* @ngInject */ ($scope) => {
        };
      },
      expected: function(){
        var x = /* @ngInject */ ($scope) => {};
        x.$inject = ["$scope"]
      }
    },
    {
      name: "Dereferenced method",
      input: function(){
        var obj = {};
        obj.bar = /*@ngInject*/ ($scope) => {};
      },
      expected: function(){
        var obj = {};
        obj.bar = /*@ngInject*/ ["$scope", ($scope) => {
        }];
      }
    },
    {
      name: "Prefixed object method",
      input: function(){
        obj = {
            controller: /*@ngInject*/ ($scope) => {},
        };
      },
      expected: function(){
        obj = {
            controller: /*@ngInject*/ ["$scope", ($scope) => {}],
        };
      }
    },
    {
      name: "Prefixed object literal",
      input: function(){
        obj = /*@ngInject*/ {
            foo: (a) => {},
            bar: (b, c) => {},
            val: 42,
            inner: {
                circle: (d) => {},
                alalalala: "long",
            },
            nest: { many: {levels: (x) => {}}},
            but: { onlythrough: ["object literals", {donttouch: (me) => {}}]},
        };
      },
      expected: function(){
        obj = /*@ngInject*/ {
            foo: ["a", (a) => {}],
            bar: ["b", "c", (b, c) => {}],
            val: 42,
            inner: {
                circle: ["d", (d) => {}],
                alalalala: "long",
            },
            nest: { many: {levels: ["x", (x) => {}]}},
            but: { onlythrough: ["object literals", {donttouch: (me) => {}}]},
        };
      }
    },
    {
      name: "Prefixed object property",
      input: function(){
        obj = {
            /*@ngInject*/
            foo: (a) => {},
            bar: (b, c) => {},
        };
      },
      expected: function(){
        obj = {
            /*@ngInject*/
            foo: ["a", (a) => {}],
            bar: (b, c) => {},
        };
      }
    },
    {
      name: "Prefixed object assignment",
      input: function(){
        /*@ngInject*/
        obj = {
            foo: (a) => {},
            bar: (b, c) => {},
            val: 42,
            inner: {
                circle: (d) => {},
                alalalala: "long",
            },
            nest: { many: {levels: (x) => {}}},
            but: { onlythrough: ["object literals", {donttouch: (me) => {}}]},
        };
      },
      expected: function(){
        /*@ngInject*/
        obj = {
            foo: ["a", (a) => {}],
            bar: ["b", "c", (b, c) => {}],
            val: 42,
            inner: {
                circle: ["d", (d) => {}],
                alalalala: "long",
            },
            nest: { many: {levels: ["x", (x) => {}]}},
            but: { onlythrough: ["object literals", {donttouch: (me) => {}}]},
        };
      }
    },
    {
      name: "Prefixed object declaration",
      input: function(){
        /*@ngInject*/
        var obj = {
            foo: (a) => {},
            bar: (b, c) => {},
            val: 42,
            inner: {
                circle: (d) => {},
                alalalala: "long",
            },
            nest: { many: {levels: (x) => {}}},
            but: { onlythrough: ["object literals", {donttouch: (me) => {}}]},
        };
      },
      expected: function(){
        /*@ngInject*/
        var obj = {
            foo: ["a", (a) => {}],
            bar: ["b", "c", (b, c) => {}],
            val: 42,
            inner: {
                circle: ["d", (d) => {}],
                alalalala: "long",
            },
            nest: { many: {levels: ["x", (x) => {}]}},
            but: { onlythrough: ["object literals", {donttouch: (me) => {}}]},
        };
      }
    },
    {
      name: "Function variable",
      input: function(){
        // @ngInject
        // has trailing semicolon
        var foo1 = ($scope) => {
        };

        // @ngInject
        // lacks trailing semicolon
        var foo2 = ($scope) => {
        }
      },
      expected: function(){
        // @ngInject
        // has trailing semicolon
        var foo1 = ($scope) => {
        };

        foo1.$inject = ["$scope"];
        // @ngInject
        // lacks trailing semicolon
        var foo2 = ($scope) => {
        }
        foo2.$inject = ["$scope"];
      }
    },
    {
      name: "Unnecessary annotation",
      input: function(){
        // adding an explicit annotation where it isn't needed should work fine
        myMod.controller("foo", /*@ngInject*/ ($scope, $timeout) => {
        });
        var foo = bar;
      },
      expected: function(){
        // adding an explicit annotation where it isn't needed should work fine
        myMod.controller("foo", /*@ngInject*/ ["$scope", "$timeout", ($scope, $timeout) => {
        }]);
        var foo = bar;
      }
    },
    {
      name: "multiple prologues",
      input: function(){
        var foos3 = ($scope) => {
            // comments are ok before the Directive Prologues
            // and there may be multiple Prologues
            "use strict"; "ngInject";
        };
      },
      expected: function(){
        var foos3 = ($scope) => {
            // comments are ok before the Directive Prologues
            // and there may be multiple Prologues
            "use strict";
        };
        foos3.$inject = ["$scope"];
      }
    },
    {
      name: "prologues in multiple assignment expression",
      input: function(){
        var dual1 = (a) => { "ngInject" }, dual2 = (b) => { "ngInject" };
      },
      expected: function(){
        var dual1 = (a) => { }, dual2 = (b) => { };
        dual2.$inject = ["b"];
        dual1.$inject = ["a"];
      }
    },
    {
      name: "prologue in anonymous function",
      input: function(){
        g((c) => {
            "ngInject"
        });
      },
      expected: function(){
        g(["c", (c) => {
        }]);
      }
    },
    {
      name: "suppress false positives with /*@ngNoInject*/, ngNoInject() and \"ngNoInject\"",
      input: function(){
        myMod.controller("suppressed", /*@ngNoInject*/($scope) => {
        });
        myMod.controller("suppressed", ngNoInject(($scope) => {
        }));
        myMod.controller("suppressed", ($scope) => {
            "ngNoInject";
        });
      },
      expected: function(){
        myMod.controller("suppressed", /*@ngNoInject*/($scope) => {
        });
        myMod.controller("suppressed", ngNoInject(($scope) => {
        }));
        myMod.controller("suppressed", ($scope) => {
            "ngNoInject";
        });
      }
    },
    {
      name: "annotated directive function",
      input: function(){
        /* @ngInject */
        var MyDirective2 = ($stateProvider) => {
            $stateProvider.state('astate', {
                resolve: {
                    /* @ngInject */
                    yoyo: (ma) => {
                    },
                }
            });
        };
      },
      expected: function(){
        /* @ngInject */
        var MyDirective2 = ($stateProvider) => {
            $stateProvider.state('astate', {
                resolve: {
                    /* @ngInject */
                    yoyo: ['ma', (ma) => {
                    }],
                }
            });
        };
        MyDirective2.$inject = ['$stateProvider'];
      }
    }
  ].map(t => { t.explicit=true; return t; })
}

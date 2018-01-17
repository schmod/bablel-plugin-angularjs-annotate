module.exports = {
  name: "Explicit ngInject annotations",
  tests: [
    {
      name: "var x = /* @ngInject */ function($scope)",
      input: function(){
        var x = /* @ngInject */ function($scope) {
        };
      },
      expected: function(){
        var x = /* @ngInject */ function($scope) {};
        x.$inject = ["$scope"]
      }
    },
    {
      name: "Dereferenced method",
      input: function(){
        var obj = {};
        obj.bar = /*@ngInject*/ function($scope) {};
      },
      expected: function(){
        var obj = {};
        obj.bar = /*@ngInject*/ ["$scope", function($scope) {
        }];
      }
    },
    {
      name: "Prefixed object method",
      input: function(){
        obj = {
            controller: /*@ngInject*/ function($scope) {},
        };
      },
      expected: function(){
        obj = {
            controller: /*@ngInject*/ ["$scope", function($scope) {}],
        };
      }
    },
    {
      name: "Prefixed object literal",
      input: function(){
        obj = /*@ngInject*/ {
            foo: function(a) {},
            bar: function(b, c) {},
            val: 42,
            inner: {
                circle: function(d) {},
                alalalala: "long",
            },
            nest: { many: {levels: function(x) {}}},
            but: { onlythrough: ["object literals", {donttouch: function(me) {}}]},
        };
      },
      expected: function(){
        obj = /*@ngInject*/ {
            foo: ["a", function(a) {}],
            bar: ["b", "c", function(b, c) {}],
            val: 42,
            inner: {
                circle: ["d", function(d) {}],
                alalalala: "long",
            },
            nest: { many: {levels: ["x", function(x) {}]}},
            but: { onlythrough: ["object literals", {donttouch: function(me) {}}]},
        };
      }
    },
    {
      name: "Prefixed object property",
      input: function(){
        obj = {
            /*@ngInject*/
            foo: function(a) {},
            bar: function(b, c) {},
        };
      },
      expected: function(){
        obj = {
            /*@ngInject*/
            foo: ["a", function(a) {}],
            bar: function(b, c) {},
        };
      }
    },
    {
      name: "Prefixed object assignment",
      input: function(){
        /*@ngInject*/
        obj = {
            foo: function(a) {},
            bar: function(b, c) {},
            val: 42,
            inner: {
                circle: function(d) {},
                alalalala: "long",
            },
            nest: { many: {levels: function(x) {}}},
            but: { onlythrough: ["object literals", {donttouch: function(me) {}}]},
        };
      },
      expected: function(){
        /*@ngInject*/
        obj = {
            foo: ["a", function(a) {}],
            bar: ["b", "c", function(b, c) {}],
            val: 42,
            inner: {
                circle: ["d", function(d) {}],
                alalalala: "long",
            },
            nest: { many: {levels: ["x", function(x) {}]}},
            but: { onlythrough: ["object literals", {donttouch: function(me) {}}]},
        };
      }
    },
    {
      name: "Prefixed object declaration",
      input: function(){
        /*@ngInject*/
        var obj = {
            foo: function(a) {},
            bar: function(b, c) {},
            val: 42,
            inner: {
                circle: function(d) {},
                alalalala: "long",
            },
            nest: { many: {levels: function(x) {}}},
            but: { onlythrough: ["object literals", {donttouch: function(me) {}}]},
        };
      },
      expected: function(){
        /*@ngInject*/
        var obj = {
            foo: ["a", function(a) {}],
            bar: ["b", "c", function(b, c) {}],
            val: 42,
            inner: {
                circle: ["d", function(d) {}],
                alalalala: "long",
            },
            nest: { many: {levels: ["x", function(x) {}]}},
            but: { onlythrough: ["object literals", {donttouch: function(me) {}}]},
        };
      }
    },
    {
      name: "Named function",
      input: function(){
        // @ngInject
        function foo($scope) {
        }
      },
      expected: function(){
        foo.$inject = ["$scope"];

        // @ngInject
        function foo($scope) {
        }
      }
    },
    {
      name: "Named function with other comments",
      input: function(){
        // @ngInject
        // otherstuff
        function Foo($scope) {
        }
      },
      expected: function(){
        Foo.$inject = ["$scope"];

        // @ngInject
        // otherstuff
        function Foo($scope) {
        }
      }
    },
    {
      name: "Function variable",
      input: function(){
        // @ngInject
        // has trailing semicolon
        var foo1 = function($scope) {
        };

        // @ngInject
        // lacks trailing semicolon
        var foo2 = function($scope) {
        }
      },
      expected: function(){
        // @ngInject
        // has trailing semicolon
        var foo1 = function($scope) {
        };

        foo1.$inject = ["$scope"];
        // @ngInject
        // lacks trailing semicolon
        var foo2 = function($scope) {
        }
        foo2.$inject = ["$scope"];
      }
    },
    {
      name: "Unnecessary annotation",
      input: function(){
        // adding an explicit annotation where it isn't needed should work fine
        myMod.controller("foo", /*@ngInject*/ function($scope, $timeout) {
        });
        var foo = bar;
      },
      expected: function(){
        // adding an explicit annotation where it isn't needed should work fine
        myMod.controller("foo", /*@ngInject*/ ["$scope", "$timeout", function($scope, $timeout) {
        }]);
        var foo = bar;
      }
    },
    {
      name: "troublesome return forces different placement of $inject array",
      input: function(){
        function outer() {
            foo;
            return {
                controller: MyCtrl,
            };

            // @ngInject
            function MyCtrl(a) {
            }
        }
      },
      expected: function(){
        function outer() {
            MyCtrl.$inject = ["a"];

            foo;
            return {
                controller: MyCtrl,
            };

            // @ngInject
            function MyCtrl(a) {
            }
        }
      }
    },
    {
      name: "explicit annotations using \"ngInject\" Directive Prologue",
      input: function(){
        function Foo2($scope) {
            "ngInject";
        }
      },
      expected: function(){
        Foo2.$inject = ["$scope"];

        function Foo2($scope) {
        }
      }
    },
    {
      name: "multiple prologues",
      input: function(){
        var foos3 = function($scope) {
            // comments are ok before the Directive Prologues
            // and there may be multiple Prologues
            "use strict"; "ngInject";
        };
      },
      expected: function(){
        var foos3 = function($scope) {
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
        var dual1 = function(a) { "ngInject" }, dual2 = function(b) { "ngInject" };
      },
      expected: function(){
        var dual1 = function(a) { }, dual2 = function(b) { };
        dual2.$inject = ["b"];
        dual1.$inject = ["a"];
      }
    },
    {
      name: "prologue in anonymous function",
      input: function(){
        g(function(c) {
            "ngInject"
        });
      },
      expected: function(){
        g(["c", function(c) {
        }]);
      }
    },
    {
      name: "suppress false positives with /*@ngNoInject*/, ngNoInject() and \"ngNoInject\"",
      input: function(){
        myMod.controller("suppressed", /*@ngNoInject*/function($scope) {
        });
        myMod.controller("suppressed", ngNoInject(function($scope) {
        }));
        myMod.controller("suppressed", function($scope) {
            "ngNoInject";
        });
      },
      expected: function(){
        myMod.controller("suppressed", /*@ngNoInject*/function($scope) {
        });
        myMod.controller("suppressed", ngNoInject(function($scope) {
        }));
        myMod.controller("suppressed", function($scope) {
            "ngNoInject";
        });
      }
    },
    {
      name: "noNgInject w/ reference-following, IIFE-jumping and so on",
      input: function(){
        /*@ngNoInject*/
        myMod.controller("suppressed", SupFoo1);
        myMod.controller("suppressed", SupFoo2);
        myMod.controller("suppressed", SupFoo3);
        function SupFoo1($scope) {
            "ngNoInject";
        }
        /*@ngNoInject*/
        function SupFoo2($scope) {
        }
        var SupFoo3 = ngNoInject(function($scope) {
            "ngNoInject";
        });
      },
      expected: function(){
        /*@ngNoInject*/
        myMod.controller("suppressed", SupFoo1);
        myMod.controller("suppressed", SupFoo2);
        myMod.controller("suppressed", SupFoo3);
        function SupFoo1($scope) {
            "ngNoInject";
        }
        /*@ngNoInject*/
        function SupFoo2($scope) {
        }
        var SupFoo3 = ngNoInject(function($scope) {
            "ngNoInject";
        });
      }
    },
    {
      name: "annotated directive function",
      input: function(){
        /* @ngInject */
        function MyDirective2($stateProvider) {
            $stateProvider.state('astate', {
                resolve: {
                    /* @ngInject */
                    yoyo: function(ma) {
                    },
                }
            });
        }
      },
      expected: function(){
        MyDirective2.$inject = ['$stateProvider'];

        /* @ngInject */
        function MyDirective2($stateProvider) {
            $stateProvider.state('astate', {
                resolve: {
                    /* @ngInject */
                    yoyo: ['ma', function(ma) {
                    }],
                }
            });
        }
      }
    },
    {
      name: "var x = /** @ngInject **/ function($scope)",
      input: function(){
        var x = /** @ngInject **/ function($scope) {
        };
      },
      expected: function(){
        var x = /** @ngInject **/ function($scope) {};
        x.$inject = ["$scope"]
      }
    }
  ].map(t => { t.explicit=true; return t; })
}

module.exports = {
  name: "Issues & Regressions",
  tests: [
    {
      name: "regression-test for https://github.com/olov/ng-annotate/issues/221",
      explicit: true,
      input: function(){
        var FooBar = (function (_super) {
            __extends(FooBar, _super);
            /*@ngInject*/
            function FooBar($a, $b) {
                _super.call(this);
            }
            /*@ngInject*/
            FooBar.onEnter = function (callback) {
                x;
            };
            return FooBar;
        })(Bar);
        var FooBar2 = (function (_super) {
            __extends(FooBar, _super);
            function FooBar($a, $b) {
                "ngInject";
                _super.call(this);
            }
            FooBar.onEnter = function (callback) {
                "ngInject";
                x;
            };
            return FooBar;
        })(Bar);
      },
      expected: function(){
        var FooBar = (function (_super) {
            FooBar.$inject = ["$a", "$b"];

            __extends(FooBar, _super);
            /*@ngInject*/
            function FooBar($a, $b) {
                _super.call(this);
            }
            /*@ngInject*/
            FooBar.onEnter = function (callback) {
                x;
            };
            FooBar.onEnter.$inject = ["callback"];
            return FooBar;
        })(Bar);
        var FooBar2 = (function (_super) {
            FooBar.$inject = ["$a", "$b"];

            __extends(FooBar, _super);
            function FooBar($a, $b) {
                _super.call(this);
            }
            FooBar.onEnter = ["callback", function (callback) {
                x;
            }];
            return FooBar;
        })(Bar);
      }
    },
    {
      name: "don't fool ng-annotate into generating false positives",
      // snippets that shouldn't fool ng-annotate into generating false positives,
      //   whether we're inside an angular module or not
      input: function(){
        myMod.controller("donttouchme", function() {
            // lo-dash regression that happened in the brief time frame when
            // notes (instad of "notes") would match. see issue #22
            var notesForCurrentPage = _.filter(notes, function (note) {
                return note.page.uid === page.uid;
            });
        });
      },
      expected: function(){
        myMod.controller("donttouchme", function() {
            // lo-dash regression that happened in the brief time frame when
            // notes (instad of "notes") would match. see issue #22
            var notesForCurrentPage = _.filter(notes, function (note) {
                return note.page.uid === page.uid;
            });
        });
      }
    },
    {
      name: "$stateProvider.decorator should not be injected",
      // not a module declaration short-form, see https://github.com/olov/ng-annotate/issues/82
      implicit: true,
      input: function(){
        $stateProvider.decorator('parent', function (state, parentFn) {
          doStuff();
        });
      },
      expected: function(){
        $stateProvider.decorator('parent', function (state, parentFn) {
          doStuff();
        });
      }
    },
    {
      name: "issue 84",
      input: function(){
        (function() {
            var MyCtrl = function($someDependency) {};
            angular.module('myApp').controller("MyCtrl", MyCtrl);
            MyCtrl.prototype.someFunction = function() {};
        })();
      },
      expected: function(){
        (function() {
            var MyCtrl = function($someDependency) {};
            MyCtrl.$inject = ["$someDependency"];
            angular.module('myApp').controller("MyCtrl", MyCtrl);
            MyCtrl.prototype.someFunction = function() {};
        })();
      }
    },
    {
      name: "empty var declarator",
      implicit: true,
      input: function(){
        var MyCtrl12;
        angular.module("MyMod").controller('MyCtrl', MyCtrl12);
      },
      expected: function(){
        var MyCtrl12;
        angular.module("MyMod").controller('MyCtrl', MyCtrl12);
      }
    },
    {
      name: "issue 115",
      explicit: true,
      input: function(){
        module.exports = function() {
            "use strict";
            return {
                restrict: 'E',
                replace: true,
                scope: { },
                controller: /*@ngInject*/function($scope, myService) {
                },
                templateUrl: "mytemplate"
            };
        };
      },
      expected: function(){
        module.exports = function() {
            "use strict";
            return {
                restrict: 'E',
                replace: true,
                scope: { },
                controller: /*@ngInject*/["$scope", "myService", function($scope, myService) {
                }],
                templateUrl: "mytemplate"
            };
        };
      }
    },
    {
      name: "issue 135",
      explicit: true,
      input: function(){
        var MyCtrl = (function() {
            /*@ngInject*/
            function MyCtrl(a) {
            }

            return MyCtrl;
        })();

        myMod.service("a", MyCtrl);
      },
      expected: function(){
        var MyCtrl = (function() {
            MyCtrl.$inject = ["a"];

            /*@ngInject*/
            function MyCtrl(a) {
            }

            return MyCtrl;
        })();

        myMod.service("a", MyCtrl);
      }
    },
    {
      name: "existing array with annotation",
      input: function(){
        g(["a", "b", function(a, b) {
          "ngInject"
        }]);
      }, expected: function(){
        g(["a", "b", function(a, b) {
        }])
      }
    },
    {
      name: "default outer function parameters",
      input: function(){
        var outside = function (arg = {}){
          var inside = function ($q) {
            'ngInject'
          };
          return inside;
        };
      }, expected: function() {
        var outside = function(arg = {}) {
          var inside = function ($q) {
          };
          inside.$inject = ['$q'];
          return inside;
        };
      },
      explicit: true
    },
    {
      name: "nested array injections w/ hoisting",
      input: function(){
        module.exports = function($filterProvider) {
          'ngInject';
          function ordinalSuffixFilter(ordinalSuffix) {
            'ngInject';
          }
        };
      },
      expected: function(){
        module.exports = ['$filterProvider', function($filterProvider) {
          ordinalSuffixFilter.$inject = ['ordinalSuffix'];
          function ordinalSuffixFilter(ordinalSuffix) {
          }
        }];
      },
      explicit: true
    }
  ]
}

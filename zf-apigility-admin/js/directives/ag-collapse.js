'use strict';

var agCollapse = angular.module('ag-collapse', []);

/* <collapse conditionals={...}></collapse> */
agCollapse.directive('collapse', function() {
    return {
        restrict: 'E',
        transclude: true,
        controller: ['$scope', '$parse', function($scope, $parse) {
            var head;
            var body;
            var buttons = [];
            var conditionals = {};
            var watchers = {};

            this.addButton = function(button) {
                /* Ensure we have boolean values for criteria flags */
                angular.forEach(button.criteria, function(flag, key) {
                    button.criteria[key] = !!flag;
                });
                buttons.push(button);
            };

            $scope.setConditionals = function(newConditionals) {
                angular.forEach(newConditionals, function(value, key) {
                    conditionals[key] = !!value;
                });
            };

            this.setFlags = function(flags) {
                angular.forEach(flags, function(value, flag) {
                    if (watchers.hasOwnProperty(flag)) {
                        var watcher = watchers[flag];
                        watcher(value);
                    } else {
                        conditionals[flag] = !!value;
                    }
                });
            };

            this.addConditionalWatcher = function(conditionalCriteria, element) {
                angular.forEach(conditionalCriteria, function(value, flag) {
                    if (!conditionals.hasOwnProperty(flag)) {
                        conditionals[flag] = false;
                    }

                    value = !!value;
                    
                    watchers[flag] = function(newVal) {
                        newVal = !!newVal;
                        if (conditionals[flag] === newVal) {
                            return;
                        }
                        conditionals[flag] = newVal;
                        element.toggleClass('hide', value !== newVal);
                    };
                });
            };

            $scope.showContainerButtons = this.showContainerButtons = function() {
                var criteria = false;
                angular.forEach(buttons, function(button) {
                    var currentCriteria = criteria;
                    angular.forEach(button.criteria, function(test, criteriaProp) {
                        if (! conditionals.hasOwnProperty(criteriaProp)) {
                            return;
                        }
                        currentCriteria = currentCriteria || (conditionals[criteriaProp] !== test);
                    });
                    button.element.toggleClass('hide', currentCriteria);
                });
            };

            $scope.hideContainerButtons = this.hideContainerButtons = function(state) {
                var bodyExpanded = body.hasClass('in');
                angular.forEach(buttons, function(button) {
                    if (state.hasOwnProperty('leave') && state.leave) {
                        button.element.toggleClass('hide', true);
                        return;
                    }

                    var currentCriteria = true;
                    angular.forEach(button.criteria, function(test, criteriaProp) {
                        if (!currentCriteria) {
                            return;
                        }
                        if (! conditionals.hasOwnProperty(criteriaProp)) {
                            return;
                        }
                        currentCriteria = (conditionals[criteriaProp] === test);
                    });
                    button.element.toggleClass('hide', currentCriteria);
                });
            };

            this.setHead = function (headScope) {
                head = headScope;
            };

            this.setBody = function (bodyElement) {
                body = bodyElement;
            };

            this.expand = function() {
                body.addClass('in');
            };

            this.collapse = function() {
                body.removeClass('in');
            };

            this.toggle = function() {
                body.toggleClass('in');
            };
        }],
        link: function(scope, element, attr) {
            if (attr.hasOwnProperty('conditionals')) {
                scope.setConditionals(scope.$eval(attr.conditionals));
            }

            element.on('mouseover', function(event) {
                scope.showContainerButtons();
            });

            element.on('mouseleave', function(event) {
                scope.hideContainerButtons({leave: true});
            });
        },
        template: '<div class="panel panel-default" ng-transclude></div>',
        replace: true
    };
});

/* <collapse-header ...></collapse-header> */
agCollapse.directive('collapseHeader', function () {
    return {
        require: '^collapse',
        restrict: 'E',
        transclude: true,
        link: function(scope, element, attr, panelCtrl) {
            panelCtrl.setHead(scope);

            element.on('click', function(event) {
                panelCtrl.toggle();
            });
        },
        template: '<div class="panel-heading" ng-transclude></div>',
        replace: true
    };
});

/* <collapse-body ...></collapse-body> */
agCollapse.directive('collapseBody', function () {
    return {
        require: '^collapse',
        restrict: 'E',
        transclude: true,
        link: function(scope, element, attr, panelCtrl) {
            panelCtrl.setBody(element);
        },
        template: '<div class="panel-collapse collapse"><div class="panel-body" ng-transclude></div></div>',
        replace: true
    };
});

/* <collapse-button [criteria="{...}"]>...</collapse-button> */
agCollapse.directive('collapseButton', function () {
    return {
        require: '^collapse',
        restrict: 'E',
        transclude: true,
        link: function(scope, element, attr, panelCtrl) {
            var criteria = {};
            if (attr.hasOwnProperty('criteria')) {
                criteria = scope.$eval(attr.criteria);
                if (typeof criteria !== 'object') {
                    criteria = {};
                }
            }

            panelCtrl.addButton({criteria: criteria, element: element});

            element.on('click', function(event) {
                panelCtrl.expand();
                panelCtrl.showContainerButtons();
                event.stopPropagation();
            });
        },
        template: '<div class="pull-right hide" ng-transclude></div>',
        replace: true
    };
});

/* <a ag-flag flags="{...}"></a> */
agCollapse.directive('agFlag', function() {
    return {
        require: '^collapse',
        restrict: 'A',
        link: function(scope, element, attr, panelCtrl) {
            if (!attr.hasOwnProperty('flags')) {
                return;
            }

            var flags = scope.$eval(attr.flags);

            if (typeof flags !== 'object') {
                return;
            }

            element.on('click', function(event) {
                panelCtrl.setFlags(flags);
            });
        }
    };
});

/* <div ag-show criteria="{...}" class="hide">...</div> */
agCollapse.directive('agShow', function() {
    return {
        require: '^collapse',
        restrict: 'A',
        link: function(scope, element, attr, panelCtrl) {
            if (!attr.hasOwnProperty('criteria')) {
                return;
            }

            var criteria = scope.$eval(attr.criteria);

            if (typeof criteria !== 'object') {
                return;
            }

            panelCtrl.addConditionalWatcher(criteria, element);
        }
    };
});

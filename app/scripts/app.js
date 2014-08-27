'use strict';

/**
 * @ngdoc overview
 * @name skeletonApp
 * @description
 * # skeletonApp
 *
 * Main module of the application.
 */
angular
    .module('skeletonApp', [
        'ngAnimate',
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'ngTouch',
        'ui.router',
        'basePages',
        'flipto.routing',
        'ngFx'
    ])
    .config(function ($locationProvider, $urlRouterProvider, $stateProvider, basePages, pageProvider, $compileProvider) {

        /*$locationProvider.html5Mode(true);*/

        $urlRouterProvider
            .otherwise('/');

        pageProvider.registerBasePages(basePages);
        pageProvider.setRootState('app.property.baseLayout');

        pageProvider.register({
            name: 'overview',
            title: 'Overview',
            sheets: [
                {
                    name: 'info',
                    url: '/overview',
                    template: '<h3>Overview</h3>'
                }
            ]
        });

        pageProvider.register({
            name: 'platform',
            title: 'Platform',
            sheets: [
                {
                    name: 'overview',
                    url: '/platform',
                    template: '<h3>Platform Overview</h3>' +
                        '<input type="button" ng-click="goToPreStay()" value="pre-stay"/>' +
                        '<input type="button" ng-click="goToPostStay()" value="post-stay"/>' +
                        '<ft-sheet-menu></ft-sheet-menu>',
                    controller: function ($scope, page) {
                        $scope.goToPreStay = function () {
                            page.open('platform.overview.pre-stay');
                        };
                        $scope.goToPostStay = function () {
                            page.open('platform.overview.post-stay');
                        };
                    },
                    sheets: [
                        {
                            name: 'pre-stay',
                            url: '/pre-stay',
                            template: '<h3>PreStay</h3><input type="button" ng-click="goToTouchpoint()" value="show touchpoint"/><input type="button" ng-click="close()" value="close"/>',
                            controller: function ($scope, page) {
                                $scope.goToTouchpoint = function () {
                                    page.open('platform.overview.pre-stay.touchpoint', {id: 1})
                                };
                            },
                            sheets: [
                                {
                                    name: 'touchpoint',
                                    url: '/touchpoint/:id',
                                    template: '<h3>Touchpoint</h3>{{touchpoint}}<input type="button" ng-click="close()" value="close"/>',
                                    resolve: {
                                        touchpoint: function ($stateParams) {
                                            return {
                                                id: $stateParams.id
                                            };
                                        }
                                    },
                                    controller: function ($scope, touchpoint) {
                                        $scope.touchpoint = touchpoint;
                                    }
                                }
                            ]
                        },
                        {
                            name: 'post-stay',
                            url: '/post-stay',
                            template: '<h3>PostStay</h3><ft-sheet-menu></ft-sheet-menu>',
                            sheets: [
                                {name: 'sheet0', url: '/sheet0', template: '<h3>Sheet0</h3>'},
                                {name: 'sheet1', url: '/sheet1', template: '<h3>Sheet1</h3>'}
                            ]
                        }
                    ]
                }
            ]
        });

        $compileProvider.directive('ftSiteMenu', ['siteMenu', function (siteMenu) {

            return {
                restrict: "EAC",
                template: '<ul ng-repeat="page in menu"><li><a ui-sref="{{page.entrance}}">{{page.title}}</a></li></ul>',
                link: function (scope) {
                    angular.extend(scope, {menu: siteMenu.pages});
                }
            };
        }]);

        $compileProvider.directive('ftSheetMenu', ['sheetMenuFactory', function (sheetMenuFactory) {

            return {
                restrict: "EAC",
                template: '<ul ng-repeat="sheet in menu"><li><a ui-sref="{{sheet.entrance}}">{{sheet.title}}</a></li></ul>',
                link: function (scope) {
                    angular.extend(scope, {menu: sheetMenuFactory()});
                }
            };
        }]);

    })
    .run(function (page, $rootScope, $log, siteMenu) {
        $log.info(siteMenu);
        page.open('overview.info');
        $rootScope.$on('page.open', function (e, sheet) {
            $log.info(sheet);
        });
    });

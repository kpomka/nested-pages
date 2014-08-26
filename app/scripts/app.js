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
    .config(function ($locationProvider, $urlRouterProvider, $stateProvider, basePages, pageProvider) {

        /*$locationProvider.html5Mode(true);*/

        $urlRouterProvider
            .otherwise('/');

        pageProvider.registerBasePages(basePages);
        pageProvider.setRootState('app.property');

        pageProvider.register({
            name: 'overview',
            sheets: [
                {
                    name: 'abc',
                    url: '/abc',
                    template: '<h3>abc</h3>{{user}} - {{property}}'
                },
                {
                    name: 'sheet0',
                    url: '/overview',
                    template: '<h3>Overview</h3><input type="button" ng-click="go()" value="go to child" /><input type="button" ng-click="openEmpty()" value="templateUrl" /><ui-view class="fx-fade-up fx-speed-1000"/>',
                    controller: function($scope, page){
                        $scope.go = function(){
                            page.open('overview.sheet0.sheet01');
                        };
                        $scope.openEmpty = function(){
                            page.open('overview.sheet0.empty');
                        };
                    },
                    sheets: [
                        {
                            name: 'empty',
                            url: '/empty',
                            templateUrl: '/views/empty.html'
                        },
                        {
                            name: 'sheet01',
                            url: '/sheet01',
                            template: '<h3>sheet0.1</h3><input type="button" ng-click="go()" value="go to parent" /><input type="button" ng-click="goChild()" value="go to child" /><input type="button" ng-click="close()" value="close" />',
                            controller: function($scope, $state, page){
                                $scope.go = function(){
                                    $state.go('app.property.overview.sheet0');
                                };
                                $scope.close = function(){
                                    page.current.close();
                                };
                                $scope.goChild = function(){
                                    $state.go('app.property.overview.sheet0.sheet01.sheet011');
                                };
                            },
                            sheets: [
                                {
                                    name: 'sheet011',
                                    url: '/sheet011',
                                    template: '<h3>sheet0.1.1</h3><input type="button" ng-click="go()" value="go to parent" />',
                                    controller: function($scope, $state){
                                        $scope.go = function(){
                                            $state.go('app.property.overview.sheet0.sheet01');
                                        };
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });

    })
    .run(function(page, $rootScope, $log){
        page.open('overview.sheet0');
        $rootScope.$on('page.open', function(e, sheet){
            $log.info(sheet);
        });
    });

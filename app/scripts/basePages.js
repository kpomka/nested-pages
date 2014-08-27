/**
 * Created by roman.kupin on 25/08/2014.
 */




(function (angular) {


    angular.module('basePages', [])
        .config([
            '$provide',
            function ($provide) {

                $provide.constant('basePages', [
                        {
                            abstract: true,
                            name: 'app',
                            template: '<ui-view/>',
                            resolve: {
                                user: ['api', function (api) {
                                    return api.getUser();
                                }]
                            },
                            controller: function($scope, user, page){
                                $scope.user = user;
                                $scope.close = function(){
                                    page.current.close();
                                };
                            }
                        },
                        {
                            abstract: true,
                            name: 'app.property',
                            template: '<ui-view/>',
                            url: '/{slug}/{type}',
                            resolve: {
                                property: function ($stateParams) {
                                    return {
                                        name: $stateParams.slug,
                                        type: $stateParams.type,
                                        isDefined: function () {
                                            return this.name && this.type;
                                        }
                                    };
                                }
                            },
                            onEnter: function (user, property, $location, $state) {
                                /**
                                 * If property is not defined - redirect to user's default property
                                 */
                                if (!property.isDefined() && $state.current.name) {
                                    $state.go($state.current.name, {slug: user.defaultProperty.name, type: user.defaultProperty.type});
                                }
                            },
                            controller: function($scope, property){
                                $scope.property = property;
                            }
                        },
                        {
                            abstract: true,
                            name: 'app.property.baseLayout',
                            template: '<ft-site-menu></ft-site-menu><ui-view/>'
                        }
                    ]
                );
            }
        ]);


    angular.module('basePages')
        .service('api', function(){

            this.getUser = function(){
                return {
                    name: 'flip.to',
                    defaultProperty: {
                        name: 'the-james-chicago',
                        type: 'property'
                    }
                };
            };
        })
})(angular);
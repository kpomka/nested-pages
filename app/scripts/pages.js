/**
 * Created by roman.kupin on 24/08/2014.
 */



(function (angular) {

    var routing = {};

    /**
     * Page object
     * @constructor
     */
    routing.Page = function (rootState) {

        /**
         * Page's root state
         */
        this.rootState = rootState;

        /**
         * Array of sheets
         * @type {Array}
         */
        this.sheets = [];
    };

    /**
     * Returns state object
     * @returns {{name: *, url: *, template: string}}
     */
    routing.Page.prototype.toState = function () {
        return {
            abstract: true,
            name: String.prototype.concat.call(this.rootState, '.', this.name),
            url: this.url,
            template: '<ui-view/>'
        };
    };

    /**
     * Sheet object
     * @param parent
     * @constructor
     */
    routing.Sheet = function (parent) {

        /**
         * Parent sheet or page in case of level-0 sheet
         * @type {routing.Page|routing.Sheet}
         */
        this.parent = parent;

        /**
         * Array of child sheets
         * @type {Array}
         */
        this.sheets = [];
    };

    /**
     * Array of supported options. Used when converting to state.
     * @type {string[]}
     */
    routing.Sheet.supportedOptions = [
        'url',
        'name',
        'template',
        'templateUrl',
        'templateProvider',
        'controller',
        'controllerProvider',
        'resolve',
        'data'
    ];

    /**
     * Returns state object
     * @returns {Object}
     */
    routing.Sheet.prototype.toState = function () {
        /*
         Copy all specified settings, but override state's name
         */
        var state = {};
        routing.Utils.copy(this, state, routing.Sheet.supportedOptions);
        state.name = String.prototype.concat.call(this.parent.toState().name, '.', this.name);
        return state;
    };

    /**
     * Encapsulates sheet's template decoration logic
     * @constructor
     */
    routing.SheetTemplateDecorator = function () {
    };

    /**
     * Decorate sheet.
     * Only decorate by template and template url if provided.
     * Decorate provider functionality is not implemented.
     * @param sheet
     */
    routing.SheetTemplateDecorator.prototype.decorate = function (sheet) {
        var state = sheet.toState();
        if (!!sheet.parent && sheet.parent instanceof routing.Page === false) {
            state = angular.copy(sheet.toState());
            state.templateProvider = state.templateProvider || ['$templateFactory', function ($templateFactory) {
                return routing.SheetTemplateDecorator.decorateByTemplate(sheet) ||
                    routing.SheetTemplateDecorator.decorateByTemplateUrl(sheet, $templateFactory);
            }];
            /* Remove decorated properties */
            delete state.template;
            delete state.templateUrl;
        }
        return state;
    };

    /**
     * Decorates template string
     * @param state
     * @returns {*}
     */
    routing.SheetTemplateDecorator.decorateByTemplate = function (state) {
        return state.template && routing.SheetTemplateDecorator.decorateText(state.template);
    };

    /**
     * Decorates template by url
     * @param state
     * @param $templateFactory
     * @returns {.views.templateUrl|*|templateUrl|F.templateUrl|r.templateUrl|derivedSyncDirective.templateUrl}
     */
    routing.SheetTemplateDecorator.decorateByTemplateUrl = function (state, $templateFactory) {
        return state.templateUrl &&
            $templateFactory
                .fromUrl(state.templateUrl)
                .then(function (content) {
                    return routing.SheetTemplateDecorator.decorateText(content);
                });
    };

    /**
     * Decorate template's text
     * @param content
     */
    routing.SheetTemplateDecorator.decorateText = function (content) {
        return String.prototype.concat.call('<sheet>', content, '</sheet><ui-view/>');
    };

    /**
     * Page factory
     * @constructor
     */
    routing.PageFactory = function () {
        /**
         * Sheet factory
         * @type {routing.SheetFactory}
         */
        this.sheetFactory = new routing.SheetFactory();
    };

    /**
     * Create page from config
     * @param config
     * @param rootState
     */
    routing.PageFactory.prototype.create = function (config, rootState) {
        var page = angular.extend(new routing.Page(rootState), config, {sheets: []});
        if (config.sheets) {
            for (var i = 0, len = config.sheets.length; i < len; ++i) {
                page.sheets.push(this.sheetFactory.create(config.sheets[i], page));
            }
        }
        return page;
    };

    /**
     * Sheet factory
     * @constructor
     */
    routing.SheetFactory = function () {
    };

    /**
     * Create sheet
     * @param config
     * @param parent
     * @returns {Object}
     */
    routing.SheetFactory.prototype.create = function (config, parent) {
        var sheet = angular.extend(new routing.Sheet(parent), config, {sheets: []});
        if (config.sheets) {
            for (var i = 0, len = config.sheets.length; i < len; ++i) {
                sheet.sheets.push(this.create(config.sheets[i], sheet));
            }
        }
        return sheet;
    };

    /**
     * Page processor
     * @constructor
     */
    routing.PageVisitor = function () {
    };

    /**
     * Process page. Register state for page and all its sheets
     * @param page
     */
    routing.PageVisitor.prototype.process = function (page) {
        /*move this code to provider*/
        var visitorFn = function (node) {
            this.$stateProvider.state(this.decorator.decorate(node));
        }.bind(this);
        this.walk(page, visitorFn);
    };

    /**
     *
     * @param source
     * @param fn
     */
    routing.PageVisitor.prototype.walk = function (source, fn) {
        fn(source);
        if (source.sheets) {
            for (var i = 0, len = source.sheets.length; i < len; ++i) {
                this.walk(source.sheets[i], fn);
            }
        }
    };

    /**
     * Array of registered pages
     * @type {Array}
     */
    routing.pages = [];

    /**
     * RootState name
     * @type {String}
     */
    routing.rootState = '';

    /**
     * Pages provider
     * @constructor
     */
    function PageProvider($stateProvider) {

        /**
         * Page factory
         * @type {routing.PageFactory}
         */
        this.factory = new routing.PageFactory();

        /**
         * Page visitor
         * @type {routing.PageVisitor}
         */
        this.visitor = new routing.PageVisitor();

        /**
         * Sheet decorator
         * @type {routing.SheetTemplateDecorator}
         */
        this.decorator = new routing.SheetTemplateDecorator();

        /**
         * $stateProvider instance
         */
        this.$stateProvider = $stateProvider;
    }

    /**
     * Set root state, registered pages will inherit from it
     * @param stateName
     */
    PageProvider.prototype.setRootState = function (stateName) {
        routing.rootState = stateName;
    };

    /**
     * Register base pages
     * @param basePages
     */
    PageProvider.prototype.registerBasePages = function (basePages) {
        if (basePages) {
            for (var i = 0, len = basePages.length; i < len; ++i) {
                this.$stateProvider.state(basePages[i]);
            }
        }
    };

    /**
     * Register page
     * @param pageConfig
     */
    PageProvider.prototype.register = function (pageConfig) {
        var page = this.factory.create(pageConfig, routing.rootState);
        this.visitor.walk(page, this.decorateAndRegister.bind(this));
        routing.pages.push(page);
    };

    /**
     * Decorate state's template and register it
     * @param state
     */
    PageProvider.prototype.decorateAndRegister = function (state) {
        this.$stateProvider.state(this.decorator.decorate(state));
    };

    /**
     * Returns pages service instance
     * @returns {*}
     */
    PageProvider.prototype.$get = ['$injector', function ($injector) {
        return $injector.instantiate(routing.PageService);
    }];

    /**
     * Pages service object
     * @constructor
     */
    function PageService($state, $rootScope) {

        /**
         * $state instance
         */
        this.$state = $state;

        /**
         * $rootScope instance
         */
        this.$rootScope = $rootScope;

        /**
         * Current page
         * @type {PageProxy}
         */
        this.current = undefined;
    }

    /**
     * Open page by name
     * @param name
     */
    PageService.prototype.open = function (name) {
        var stateName = String.prototype.concat.call(routing.rootState, '.', name);
        this.$state.go(stateName);
    };

    /**
     * Perform sheet lookup
     * @param name
     * @param current
     * @returns {*}
     */
    PageService.prototype.get = function (name, current) {
        current = current || angular.extend(new routing.Page(routing.rootState), {
            name: '',
            sheets: routing.pages
        });
        if (current.toState().name === name) return current;
        for (var i = 0, len = current.sheets.length; i < len; ++i) {
            var sheet = this.get(name, current.sheets[i]);
            if (sheet) return sheet;
        }
    };

    /**
     * Proxy over page
     * @param $state
     * @param page
     * @constructor
     */
    function PageProxy($state, page) {

        /**
         * $state instance
         */
        this.$state = $state;

        /**
         * Current page
         */
        this.page = page;
    }

    /**
     * Close page
     */
    PageProxy.prototype.close = function () {
        var parentState = this.page.parent.toState().name;
        this.$state.go(parentState);
    };

    routing.Utils = {

        /**
         * Copy properties from one object to another
         * @param from
         * @param to
         * @param options
         */
        copy: function (from, to, options) {
            angular.forEach(options, function (key) {
                if (!!from[key]) {
                    to[key] = from[key];
                }
            });
        }
    };

    routing.module = angular.module('flipto.routing', ['ui.router']);
    routing.PageProvider = ['$stateProvider', PageProvider];
    routing.PageService = ['$state', '$rootScope', PageService];
    routing.PageProxy = ['$state', 'page', PageProxy];
    routing.module.config(['$provide', '$compileProvider', function ($provide, $compileProvider) {
        $provide.provider('page', routing.PageProvider);
        $compileProvider.directive('sheet', [function () {

            return {
                restrict: "E",
                replace: true,
                transclude: true,
                template: '<div class="sheet-abs" ng-transclude></div>'
            };
        }])
    }]);
    routing.module.run(['$rootScope', '$injector', 'page', function ($rootScope, $injector, page) {
        /**
         * Subscribe to $stateChangeSuccess event in order to change current page
         */
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {

            var changedToPage = page.get(toState.name, angular.extend(new routing.Page(routing.rootState), {
                name: '',
                sheets: routing.pages
            }));

            if (!changedToPage) throw 'Unable to get page for ' + toState.name;
            page.current = $injector.instantiate(routing.PageProxy, {page: changedToPage});
            $rootScope.$broadcast('page.open', changedToPage);
        });

        $rootScope.$on('$stateChangeStart', function(){
        });
    }]);

})(angular);
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
     * Returns url which activates page
     * @returns {*}
     */
    routing.Page.prototype.getEntranceUrl = function () {
        var sheetToBeActivated = this.sheets && this.sheets[0];
        if (!sheetToBeActivated) throw 'Page ' + this.name + ' can not be activated';
        return String.prototype.concat.call(!!this.url ? this.url : '', sheetToBeActivated.url);
    };

    /**
     * Returns state which activates page
     * @returns {*}
     */
    routing.Page.prototype.getEntrance = function () {
        var sheetToBeActivated = this.sheets && this.sheets[0];
        if (!sheetToBeActivated) throw 'Page ' + this.name + ' can not be activated';
        return sheetToBeActivated.toState().name;
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
     * Returns state which activates sheet
     * @returns {*}
     */
    routing.Sheet.prototype.getEntrance = function () {
        return this.toState().name;
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
        if (sheet instanceof routing.Sheet) {
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
     * @param sheet
     * @returns {*}
     */
    routing.SheetTemplateDecorator.decorateByTemplate = function (sheet) {
        return sheet.template && routing.SheetTemplateDecorator.decorateContent(sheet.template, sheet);
    };

    /**
     * Decorates template by url
     * @param sheet
     * @param $templateFactory
     * @returns {.views.templateUrl|*|templateUrl|F.templateUrl|r.templateUrl|derivedSyncDirective.templateUrl}
     */
    routing.SheetTemplateDecorator.decorateByTemplateUrl = function (sheet, $templateFactory) {
        return sheet.templateUrl &&
            $templateFactory
                .fromUrl(sheet.templateUrl)
                .then(function (content) {
                    return routing.SheetTemplateDecorator.decorateContent(content, sheet);
                });
    };

    /**
     * Decrate content depending on type of sheet
     * @param content
     * @param sheet
     * @returns {*}
     */
    routing.SheetTemplateDecorator.decorateContent = function (content, sheet) {
        if (!!sheet.parent && sheet.parent instanceof routing.Page === false) {
            content = routing.SheetTemplateDecorator.surroundWithSheet(content);
        }
        content = routing.SheetTemplateDecorator.appendUiView(content);
        return content;
    };

    /**
     * Surround with <ft-sheet/> directive
     * @param content
     */
    routing.SheetTemplateDecorator.surroundWithSheet = function (content) {
        return String.prototype.concat.call('<ft-sheet>', content, '</ft-sheet>');
    };

    /**
     * Append <ui-view/> directive at the end of content
     * @param content
     */
    routing.SheetTemplateDecorator.appendUiView = function (content) {
        return String.prototype.concat.call(content, '<ui-view/>');
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
        routing.SiteMenu.add(page);
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
     * @param params
     */
    PageService.prototype.open = function (name, params) {
        var stateName = String.prototype.concat.call(routing.rootState, '.', name);
        this.$state.go(stateName, params);
    };
    /**
     * Perform sheet lookup
     * @param name
     * @param parent
     * @returns {*}
     */
    PageService.prototype.get = function (name, parent) {
        parent = parent || angular.extend(new routing.Page(routing.rootState), {
            name: '',
            sheets: routing.pages
        });
        if (parent.toState().name === name) return parent;
        for (var i = 0, len = parent.sheets.length; i < len; ++i) {
            var sheet = this.get(name, parent.sheets[i]);
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

    /**
     * SiteMenu object
     * @constructor
     */
    function SiteMenu() {

        /**
         * Array of pages
         * @type {Array}
         */
        this.pages = [];
    }

    SiteMenu.prototype.add = function (page) {
        this.pages.push({
            title: page.title || page.name,
            entranceUrl: page.getEntranceUrl(),
            entrance: page.getEntrance()
        });
    };

    /**
     * Sheet menu factory object
     * @constructor
     */
    function SheetMenuFactory() {
    };

    /**
     * Create sheet menu for page
     * @param pageProxy
     * @returns {Array}
     */
    SheetMenuFactory.prototype.create = function (pageProxy) {
        var sheets = [];
        pageProxy.page.sheets && angular.forEach(pageProxy.page.sheets, function (sheet) {
            sheets.push({
                title: sheet.title || sheet.name,
                entrance: sheet.getEntrance()
            });
        });
        return sheets;
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
    routing.SiteMenu = new SiteMenu();
    var sheetMenuFactory = new SheetMenuFactory();
    routing.module.config(['$provide', '$compileProvider', function ($provide, $compileProvider) {
        $provide.provider('page', routing.PageProvider);
        $provide.factory('siteMenu', [function () {
            return routing.SiteMenu;
        }]);
        $provide.factory('sheetMenuFactory', ['page', function(page){
            return function(){ return sheetMenuFactory.create(page.current);}
        }]);
        $compileProvider.directive('ftSheet', [function () {

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

        $rootScope.$on('$stateChangeStart', function () {
        });
    }]);

})(angular);
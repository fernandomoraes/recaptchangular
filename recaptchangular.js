;( function ( angular, undefined ) {

    var recaptchangular = angular.module('recaptchangular', []);

    recaptchangular.provider('Recaptchangular', [function () {

        var theme = 'light';

        var siteKey;

        this.withTheme = function (theme_) {
            theme = theme_;
            return this;
        };

        this.withSiteKey = function (key) {
            siteKey = key;
        };

        this.$get = [function () {

            return {
                getTheme: function () {
                    return theme;
                },
                getSiteKey: function () {
                    return siteKey;
                }
            };

        }];

    }]);

    recaptchangular.service('RecaptchaService', ['$window', '$q', function ($window, $q) {

        var deferred = $q.defer();
        var promise = deferred.promise;
        var recaptcha;

        function recaptchaAPILoaded () {
            recaptcha = $window.grecaptcha;
            deferred.resolve(recaptcha);            
        }

        function getRecaptcha () {
            if (!!recaptcha) {
                return $q.when(recaptcha);
            }

            return promise;
        }

        if (angular.isDefined($window.grecaptcha)) {
            recaptchaAPILoaded();
        }

        return {

            create: function (elm, key, theme, callback) {

                var config = {
                    sitekey: key,
                    theme: theme,
                    callback: callback
                };

                return getRecaptcha().then(function (recaptcha) {
                    return recaptcha.render(elm, config);
                });
            }

        };

    }]);

    recaptchangular.directive('reCaptcha', ['Recaptchangular', 'RecaptchaService', '$timeout', function (Recaptchangular, RecaptchaService, $timeout) {

        return {

            restrict: 'A',
            require: 'ngModel',
            scope: {
                ngModel: '=',
                theme: '='
            },

            link: function (scope, elm, attrs, ctrl) {

                var timeoutId;
                var timeExpires = 2 * 60 * 1000;

                var theme = scope.theme || Recaptchangular.getTheme();
                var key = Recaptchangular.getSiteKey();
                var local = elm[0];

                var promise = RecaptchaService.create(local, key, theme, function (grecaptchaResponse) {

                    scope.ngModel = grecaptchaResponse;
                    scope.$apply();

                    timeoutId = $timeout(function () {
                        scope.ngModel = null;
                    }, timeExpires);

                });

                scope.$on('destroy', function () {
                    $timeout.cancel(timeoutId); //TODO: test
                });

            }

        };

    }]);

}) (angular);
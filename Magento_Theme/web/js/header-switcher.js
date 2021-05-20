require(['jquery'], function($) {
    'use strict';
    $("document").ready(function() {
        var list_childs = $('.nav-item.level0.level-top.right.b2c-checkbox').children();
        priceSwitch(isSwitchSet());
        var intervals = new Array();
        var counter = 0;
        var configs = [{
                key: 'block.aw_wbtab',
                check: function() {
                    return $('.block.aw_wbtab .slick-list').length > 0;
                },
                successCallback: priceSwitchActive,
                failCallback: priceSwitchDeactive,
            },
            {
                key: 'mini-cart',
                check: function() {
                    return $('#mini-cart').find('.price-container').length > 0;
                },
                successCallback: priceSwitchActive,
                failCallback: priceSwitchDeactive,
            },
            {
                key: 'checkout-shipping',
                check: function() {
                    return $('#checkout-shipping-method-load').length > 0;
                },
                successCallback: priceSwitchActive,
                failCallback: priceSwitchDeactive,
            }
        ];

        function isSwitchSet() {
            var switchCase = JSON.parse(localStorage.getItem('tax-switch'));
            return (switchCase + '').toLowerCase() == 'true';
        }

        function registerInterval(conf) {
            var config = Object.assign({ counter: 0 }, conf);
            intervals[config.key] = setInterval(function() {
                config.counter += 1;
                var check = config.check();
                if (check) {
                    if (isSwitchSet()) {
                        config.successCallback();
                    } else {
                        config.failCallback();
                    }
                }
                if (check || config.counter >= 250) {
                    clearInterval(intervals[config.key]);
                }
            }, 200);
        }
        for (var index = 0; index < configs.length; index++) {
            registerInterval(configs[index]);
        }
        $('#check').click(function() {
            $('#check').is(":checked") ? priceSwitch(true) : priceSwitch(false);
        });

        shippingType();

        function priceSwitch(currState) {
            if (currState == true) {
                priceSwitchActive();
            } else {
                priceSwitchDeactive();
            }
        }

        function priceSwitchActive() {
            localStorage.setItem('tax-switch', true);
            $('#check').prop('checked', true);
            $(list_childs[2]).removeClass('onload-color');
            $(list_childs[0]).addClass('onload-color');
            $('.price-including-tax').css("display", "table-footer-group");
            $('.price-including-tax').addClass('business').removeClass('consumer');
            $('.price-excluding-tax').addClass('business').removeClass('consumer');
        }

        function priceSwitchDeactive() {
            localStorage.setItem('tax-switch', false);
            $(list_childs[2]).addClass('onload-color');
            $(list_childs[0]).removeClass('onload-color');
            $('.price-including-tax').css("display", "table-header-group");
            $('.price-including-tax').addClass('consumer').removeClass('business');
            $('.price-excluding-tax').addClass('consumer').removeClass('business');
        }
        /**
         * Shopping cart default delivery option
         */
        function shippingType() {
            if ($('.checkout-cart-index').length) {
                var shippingHandle = setInterval(function() {
                    if ($('#co-shipping-method-form .radio[name="shipping-method-option').length > 0) {
                        $('#co-shipping-method-form .radio[name="shipping-method-option"]').each(function(index) {
                            (index == 0) ? $(this).attr('checked', true): $('#pickup_mock_up').slideUp(0);
                            clearInterval(shippingHandle);
                        });
                    }
                }, 5000);
            }
        }
    });
});
require(['jquery'], function($) {
    'use strict';
    $("document").ready(function() {
        var list_childs = $('.nav-item.level0.level-top.right.b2c-checkbox').children();
        var switchState = JSON.parse(localStorage.getItem('tax-switch'));
        priceSwitch(switchState);
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
        ]

        for (var index = 0; index < configs.length; index++) {
            var config = configs[index];
            config.counter = 0;
            intervals[config.key] = setInterval(function() {
                config.counter += 1;
                var check = config.check();
                if (check) {
                    if (switchState == "true") {
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

        $('#check').click(function() {
            $('#check').is(":checked") ? priceSwitch(true) : priceSwitch(false);
        });

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

    });
});
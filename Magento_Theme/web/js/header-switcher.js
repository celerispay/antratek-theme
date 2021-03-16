require(['jquery'], function($) {
    'use strict';
    $("document").ready(function() {
        var list_childs = $('.nav-item.level0.level-top.right.b2c-checkbox').children();
        var switchState = localStorage.getItem('tax-switch');
        var interval = undefined;
        var counter = 0;
        interval = setInterval(function() {
            counter += 1;
            var check = $('.block.aw_wbtab .slick-list').length > 0;
            if (check) {
                if (switchState == "true") {
                    priceSwitchActive();
                } else {
                    priceSwitchDeactive();
                }
            }
            if (check || counter >= 250) {
                clearInterval(interval);
            }
        }, 200)
        $('#check').click(function() {
            if ($('#check').is(":checked") == true) {
                priceSwitchActive();
            } else {
                priceSwitchDeactive();
            }
        });

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
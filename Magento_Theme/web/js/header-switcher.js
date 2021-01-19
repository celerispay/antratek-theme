require(['jquery'], function($) {
    'use strict';
    $("document").ready(function() {
        var list_childs = $('.nav-item.level0.level-top.right.b2c-checkbox').children();
        $("#check").click(function() {
            if ($('#check').is(":checked")) {
                $(list_childs[2]).removeClass('onload-color');
                $(list_childs[0]).addClass('onload-color');
                $('.price-including-tax').css("display", "table-footer-group");
                $('.price-including-tax .price').css("font-size", "1.6rem");
                $('.price-excluding-tax .price').css("font-size", "2.2rem");
            } else {
                $(list_childs[2]).addClass('onload-color');
                $(list_childs[0]).removeClass('onload-color');
                $('.price-including-tax').css("display", "table-header-group");
                $('.price-including-tax .price').css("font-size", "2.2rem");
                $('.price-excluding-tax .price').css("font-size", "1.6rem");
            }
        });
    });
});
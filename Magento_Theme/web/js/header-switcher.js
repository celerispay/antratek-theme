require(['jquery'], function ($) {
    'use strict';
    $("document").ready(function () {
        var list_childs = $('.nav-item.level0.level-top.right.b2c-checkbox').children();
        $("input#check").click(function () {
            if ($('input#check').is(":checked")) {
                $(list_childs[2]).removeClass('onload-color');
                $(list_childs[0]).addClass('onload-color');
            } else {
                $(list_childs[2]).addClass('onload-color');
                $(list_childs[0]).removeClass('onload-color');
            }
        })
    });
});


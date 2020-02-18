require(['jquery'], function ($) {
    'use strict';
    $("document").ready(function () {
        var list_childs = $('.nav-item.level0.level-top.right.b2c-checkbox').children();
        var inp = $("#check");
        var sel = $(".tax_display_select");
        var switcherVal = sel.val();
        if (switcherVal == 1) {
            inp.prop("checked", true);
            $(list_childs[2]).removeClass('onload-color');
            $(list_childs[0]).addClass('onload-color');
        } else {
            inp.prop("checked", false);
            $(list_childs[2]).addClass('onload-color');
            $(list_childs[0]).removeClass('onload-color');
        }
        $(inp).change(function () {
            var checked = inp.prop("checked");
            sel.val(checked ? 1 : 2);
            if (checked) {
                $(list_childs[2]).removeClass('onload-color');
                $(list_childs[0]).addClass('onload-color');
            } else {
                $(list_childs[2]).addClass('onload-color');
                $(list_childs[0]).removeClass('onload-color');
            }
            sel.trigger("change");
        });
    });
});


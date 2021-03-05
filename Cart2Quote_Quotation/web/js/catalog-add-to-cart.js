/*
 * Copyright (c) 2020. Cart2Quote B.V. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
    'jquery',
    'mage/translate',
    'jquery/ui',
    'Magento_Catalog/js/catalog-add-to-cart'
], function($, $t) {
    "use strict";

    $.widget('cart2quote.catalogAddToCart', $.mage.catalogAddToCart, {
        options: {
            defaultButtonSelector: '',
            defaultButtonDisabledClass: '',
            defaultButtonTextWhileAdding: '',
            defaultButtonTextAdded: '',
            defaultButtonTextDefault: '',
            defaultMiniSelector: '',
            addToQuoteButtonSelector: '.action.toquote',
            addToQuoteButtonDisabledClass: 'disabled',
            addToQuoteButtonTextWhileAdding: $t('Adding to Quote...'),
            addToQuoteButtonTextAdded: $t('Added'),
            addToQuoteButtonTextDefault: $t('Add to Quote'),
            printQuoteButtonTextWhileAdding: $t('Printing quote...'),
            printQuoteButtonTextAdded: $t('Printed'),
            printQuoteButtonTextDefault: $t('Print Quote'),
            miniquoteSelector: '[data-block="miniquote"]',
            printSelector: '',
            printQuoteSelector: '',
            defaultAction: null,
            addToQuoteFormAction: null,
            printQuoteAction: null
        },
        /** @inheritdoc */
        _create: function() {
            this._super();
            this._setDefaultValues();
        },
        /** @protected */
        _setDefaultValues: function() {
            this.options.defaultAction = this.element.attr('action');
            this.options.defaultButtonSelector = this.options.addToCartButtonSelector;
            this.options.defaultButtonDisabledClass = this.options.addToCartButtonDisabledClass;
            this.options.defaultButtonTextWhileAdding = this.options.addToCartButtonTextWhileAdding;
            this.options.defaultButtonTextAdded = this.options.addToCartButtonTextAdded;
            this.options.defaultButtonTextDefault = this.options.addToCartButtonTextDefault;
            this.options.defaultMiniSelector = this.options.minicartSelector;
        },
        /** @protected */
        _prepareForCartSubmit: function() {
            var self = this;
            this.element.attr('action', this.options.defaultAction);
            this.options.addToCartButtonSelector = this.options.defaultButtonSelector;
            this.options.addToCartButtonDisabledClass = this.options.defaultButtonDisabledClass;
            this.options.addToCartButtonTextWhileAdding = this.options.defaultButtonTextWhileAdding;
            this.options.addToCartButtonTextAdded = this.options.defaultButtonTextAdded;
            this.options.addToCartButtonTextDefault = this.options.defaultButtonTextDefault;
            this.options.minicartSelector = this.options.defaultMiniSelector;
        },
        /** @protected */
        _prepareForQuoteSubmit: function() {
            var self = this;
            this.element.attr('action', this.options.addToQuoteFormAction);
            this.options.addToCartButtonSelector = this.options.addToQuoteButtonSelector;
            this.options.addToCartButtonDisabledClass = this.options.addToQuoteButtonDisabledClass;
            this.options.addToCartButtonTextWhileAdding = this.options.addToQuoteButtonTextWhileAdding;
            this.options.addToCartButtonTextAdded = this.options.addToQuoteButtonTextAdded;
            this.options.addToCartButtonTextDefault = this.options.addToQuoteButtonTextDefault;
            this.options.minicartSelector = this.options.miniquoteSelector;
            this.options.ajaxMessageQuote = true;
        },
        _prepareForQuotePrint: function() {
            var self = this;
            this.element.attr('action', this.options.printQuoteAction);
            this.options.addToCartButtonSelector = this.options.printQuoteSelector;
            this.options.addToCartButtonTextWhileAdding = this.options.printQuoteButtonTextWhileAdding;
            this.options.addToCartButtonTextAdded = this.options.printQuoteButtonTextAdded;
            this.options.addToCartButtonTextDefault = this.options.printQuoteButtonTextDefault;
            this.options.minicartSelector = this.options.printSelector;
        },
        /** @protected */
        _init: function() {
            var self = this;
            if (this.element.data('quote-submit-action')) {
                this.options.addToQuoteFormAction = this.element.data('quote-submit-action');
            }
            this.element.find(this.options.addToQuoteButtonSelector).on(
                'click',
                this._prepareForQuoteSubmit.bind(this)
            );
            this.element.find(':submit').not(this.options.addToQuoteButtonSelector).on(
                'click',
                this._prepareForCartSubmit.bind(this)
            );
            this.element.find(this.options.printQuoteSelector).on(
                'click',
                this._prepareForQuotePrint.bind(this)
            );
            var addToQuoteButton = this.element.find(this.options.addToQuoteButtonSelector);
            addToQuoteButton.removeClass(this.options.addToQuoteButtonDisabledClass);

            $(document).on('ajaxSend.catalog-add-product-cart', function(event, jqxhr, settings) {
                if (settings.url === self.options.defaultAction) {
                    $(document).trigger('startProductAddToCart');
                }
            });
            $(document).on('ajaxComplete.catalog-add-product-cart', function(event, jqxhr, settings) {
                if (settings.url === self.options.defaultAction) {
                    $(document).trigger('stopProductAddToCart');
                }
            });
            $(document).on('ajaxSuccess.catalog-add-product-cart', function(event, jqxhr, settings) {
                if (settings.url === self.options.defaultAction && !jqxhr.responseJSON.backUrl) {
                    $(document).trigger('successProductAddToCart');
                }
            });
            $(document).on('ajaxSend.catalog-add-product-quote', function(event, jqxhr, settings) {
                if (settings.url === self.options.addToQuoteFormAction) {
                    $(document).trigger('startProductAddToQuote');
                }
            });
            $(document).on('ajaxComplete.catalog-add-product-quote', function(event, jqxhr, settings) {
                if (settings.url === self.options.addToQuoteFormAction) {
                    $(document).trigger('stopProductAddToQuote');
                }
            });
            $(document).on('ajaxSuccess.catalog-add-product-quote', function(event, jqxhr, settings) {
                if (settings.url === self.options.addToQuoteFormAction && !jqxhr.responseJSON.backUrl) {
                    $(document).trigger('successProductAddToQuote');
                }
            });
        },
        submitForm: function(form) {
            if (form.attr('action') !== this.options.printQuoteAction) {
                this._super(form);
            } else {
                this.disableAddToCartButton(form);
                form.unbind("submit");
                form.submit();
                this.enableAddToCartButton(form);
                this.element.data('catalog-addtocart-initialized', 0);
                this._bindSubmit();
            }
        }
    });

    return $.cart2quote.catalogAddToCart;
});
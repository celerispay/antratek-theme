/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
    'ko',
    'underscore',
    'uiComponent',
    'Magento_Checkout/js/model/shipping-service',
    'Magento_Catalog/js/price-utils',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/action/select-shipping-method',
    'Magento_Checkout/js/checkout-data',
    'jquery'
], function(ko, _, Component, shippingService, priceUtils, quote, selectShippingMethodAction, checkoutData, $) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Magento_Checkout/cart/shipping-rates'
        },
        isVisible: ko.observable(!quote.isVirtual()),
        isLoading: shippingService.isLoading,
        shippingRates: shippingService.getShippingRates(),
        shippingRateGroups: ko.observableArray([]),
        selectedShippingMethod: ko.computed(function() {
            return quote.shippingMethod() ?
                quote.shippingMethod()['carrier_code'] + '_' + quote.shippingMethod()['method_code'] :
                null;
        }),


        /**
         * @override
         */
        initObservable: function() {
            var self = this;

            this._super();

            this.shippingRates.subscribe(function(rates) {
                self.shippingRateGroups([]);
                _.each(rates, function(rate) {
                    var carrierTitle = rate['carrier_title'];

                    if (self.shippingRateGroups.indexOf(carrierTitle) === -1) {
                        self.shippingRateGroups.push(carrierTitle);
                    }
                });
            });
            return this;
        },

        /**
         * Get shipping rates for specific group based on title.
         * @returns Array
         */
        getRatesForGroup: function(shippingRateGroupTitle) {
            return _.filter(this.shippingRates(), function(rate) {
                return shippingRateGroupTitle === rate['carrier_title'];
            });
        },

        /**
         * Format shipping price.
         * @returns {String}
         */
        getFormattedPrice: function(price) {
            return priceUtils.formatPrice(price, quote.getPriceFormat());
        },

        /**
         * Set shipping method.
         * @param {String} methodData
         * @returns bool
         */
        selectShippingMethod: function(methodData) {
            selectShippingMethodAction(methodData);
            checkoutData.setSelectedShippingRate(methodData['carrier_code'] + '_' + methodData['method_code']);

            return true;
        },

        /**
         * select shipping type
         */
        isShippingMethod: function(event, data) {
            if (data.target.checked == true) {
                $('#co-shipping-method-form .radio[name="shipping-method-option"]').each(function(index) {
                    if ($(this).is(':checked')) {
                        $('#co-shipping-method-form .methods .item-options').slideUp(0);
                        $(this).closest('.item-title').next('.item-options').slideDown(300);
                    }
                });
            }
        }
    });
});
/* release 1.0.6*/
define(
    [
        'jquery',
        'uiComponent',
        'Magento_Checkout/js/model/quote',
        'uiRegistry',
        'Magento_Checkout/js/model/shipping-rates-validator',
        'Magento_Checkout/js/model/shipping-service',
        'Magento_Catalog/js/price-utils',
        'Magento_Checkout/js/checkout-data',
    ],
    function($, Component, quote, registry, shippingRatesValidator, shippingService, priceUtils, checkoutData) {
        "use strict";
        var checkoutConfig = window.checkoutConfig;
        var selected_pickuppoint_address = {};
        var selected_method = null;
        var component = null;
        var first = false;

        function initHtml(markers) {
            if (markers.length > 0) {
                var selectOptions = '';
                var items = '';
                var days = checkoutConfig.logxstar.pickuppoint.week_days;
                for (var index = 0; index < markers.length; index++) {
                    var zip = formatZip(markers[index].address_data.zipcode);
                    selectOptions = selectOptions + '<option value=\'' + markers[index].id + '\'>' + markers[index].id + '</option>';
                    var data_address = [
                        markers[index].address_data.name,
                        markers[index].address_data.street + ' ' + markers[index].address_data.housenr,
                        zip,
                        markers[index].address_data.city,
                        $.mage.__('Distance') + ' ' + markers[index].address_data.distance + 'm'
                    ];


                    data_address = data_address.join(', ');
                    if (markers[index].price == '0.00') {
                        var price = 'free';
                    } else {
                        var price = priceUtils.formatPrice(markers[index].price, quote.getPriceFormat());
                    }

                    var working_hours = '';
                    for (var i = 0; i < 7; i++) {
                        working_hours = working_hours + '<tr>\
                            <td class="trn">' + days[i].label + '</td>\
                            <td class="trn">';
                        if (markers[index].working_hours[days[i].name] !== undefined) {
                            working_hours = working_hours + markers[index].working_hours[days[i].name];
                        } else {
                            working_hours = working_hours + 'Gesloten';
                        }
                        working_hours = working_hours + '</td></tr>';
                    }

                    items = items + '\
                        <div class="item pickuppoint_item row" data-price="' + price + '" data-code="' + markers[index].carrier + '" data-value="' + markers[index].id + '"data-address="' + data_address + '">\
                            <div class="col-lg-11 left">\
                                <div>\
                                    <span class="title">' + markers[index].address_data.name.toLowerCase() + '</span>\
                                </div>\
                                <div>\
                                <span class="address" data-field="address">' + markers[index].address_data.street.toLowerCase() + ' ' + markers[index].address_data.housenr + '</span>\
                                </div>\
                                <div>\
                                <span class="address" data-field="postal">' + zip + '</span>\
                                <span class="address" data-field="city">' + markers[index].address_data.city.toLowerCase() + '</span>\
                                </div>\
                            </div>\
                            <div class="col-lg-1 left">\
                                <div class="col-lg-12">\
                                    <img class="carrier_logo" src=' + component.getImagePath() + '/' + component.filters_details[markers[index].carrier].logo + ' />\
                                </div>\
                                <div>\
                                    <span class="distance">' + markers[index].address_data.distance + ' m</span>\
                                </div>\
                                <div>\
                                    <span class="price">' + price + '</span>\
                                </div>\
                            </div>\
                            <div class="details_holder">\
                                <div class="row infowindow">\
                                    <div class="col-lg-7 left"> \
                                        <span class="title">' + markers[index].address_data.name.toLowerCase() + '</span>\
                                        <div class = "row">\
                                            <span class="address">' + markers[index].address_data.street.toLowerCase() + ' ' + markers[index].address_data.housenr + '</span><br/>\
                                            <span class="address">' + zip + ' ' + markers[index].address_data.city.toLowerCase() + '</span><br/>\
                                            <span class="distance"><span class="trn">Afstand</span> ' + markers[index].address_data.distance + 'm</span>\
                                        </div>\
                                        <button style="margin: 15px 0 0 0;" type="submit" class="btn btn-primary ls_modal_submit trn">Kies dit servicepunt</button>\
                                    </div>\
                                    <div class="col-lg-5 left">\
                                        <span class="info_title trn" >Openingstijden</span>\
                                        <table>\
                                            <tbody>\
                                            ' + working_hours + '\
                                            </tbody>\
                                        </table>\
                                        <button style="margin: 15px 0 0 0;" type="submit" class="btn btn-primary btn-primary-mobile ls_modal_submit trn">Kies dit servicepunt</button>\
                                    </div>\
                                </div>\
                            </div>\
                        </div>';
                }

                jQuery('#map-modal-items').html(items);
                jQuery('.pickuppoint_item').off('click').on('click', function() {
                    select_item(jQuery(this));
                });
                jQuery('.pickuppoint_item').first().trigger('click');
                jQuery('#choose-pickup-location').append(selectOptions);
            }
        }

        function formatZip(zipcode) {
            var parts = zipcode.match(/([0-9]+)([A-Za-z]+)/);
            if (parts != null) {
                delete(parts[0]);
                return parts.join(' ');
            } else {
                return zipcode;
            }
        }
        var request_script = function(url, callback) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.onload = callback;
            script.src = url;
            document.getElementsByTagName('head')[0].appendChild(script);
        }
        var contentString;
        var map;
        var translator;
        var infowindow;
        var mapMarkers = [];
        var mapinitialized = false;
        var mapscriptinitialized = false;

        function initMap(markers) {
            var initMapSub = function() {
                if (markers.length > 0) {
                    var styleArray = [{
                        "featureType": "all",
                        "stylers": [{ "saturation": 0 }, { "hue": "#e7ecf0" }]
                    }, { "featureType": "road", "stylers": [{ "saturation": -70 }] }, {
                        "featureType": "transit",
                        "stylers": [{ "visibility": "off" }]
                    }, { "featureType": "poi", "stylers": [{ "visibility": "off" }] }, {
                        "featureType": "water",
                        "stylers": [{ "visibility": "simplified" }, { "saturation": -60 }]
                    }];

                    var myLatLng = { lat: parseFloat(markers[0].latitude), lng: parseFloat(markers[0].longitude) };

                    if (!map && !mapinitialized) {
                        map = new google.maps.Map(document.getElementById('map'), {
                            center: myLatLng,
                            zoom: 14,
                            disableDefaultUI: true,
                            styles: styleArray
                        });
                        mapinitialized = true;
                        infowindow = new google.maps.InfoWindow({
                            content: '',
                            maxWidth: 422
                        });
                        markerClientLocation();
                    }
                    for (var i = 0; i < mapMarkers.length; i++) {
                        var tmp_marker = mapMarkers.pop();
                        tmp_marker.setMap(null);
                    }
                    for (var index = 0; index < markers.length; index++) {
                        var marker = new google.maps.Marker({
                            position: { lat: parseFloat(markers[index].latitude), lng: parseFloat(markers[index].longitude) },
                            map: map,
                            title: markers[index].address,
                            id: markers[index].id,
                            icon: component.getImagePath() + '/' + markers[index].carrier + '-marker.png'
                        });
                        marker.addListener('click', function() {
                            select_item_id(this.id);
                        });
                        mapMarkers.push(marker);
                    }

                    initHtml(markers);
                    $("#map").css("position", "inherit !important");
                    select_marker();
                }
            }
            if (mapinitialized || (typeof google !== 'undefined' && typeof google.maps !== 'undefined')) {
                initMapSub();
            } else {
                if (!mapscriptinitialized) {
                    request_script('https://maps.googleapis.com/maps/api/js?key=' + checkoutConfig.logxstar.pickuppoint.map_apikey, initMapSub);
                    mapscriptinitialized = true;
                }
            }
        }

        function markerClientLocation() {
            var shippingAddress = quote.shippingAddress();
            var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + formatZip(shippingAddress.postcode).replace(" ", "") + ',' + shippingAddress.countryId + '&key=' + checkoutConfig.logxstar.pickuppoint.map_apikey,
                initMapSub;

            $.ajax({ url: url }).done(function(response) {
                if (response.status == "OK") {
                    var marker = new google.maps.Marker({
                        position: {
                            lat: parseFloat(response.results[0].geometry.location.lat),
                            lng: parseFloat(response.results[0].geometry.location.lng)
                        },
                        map: map,
                        title: 'Your lacation',
                        id: 'user_place',
                        zIndex: 99999999,
                        icon: component.getImagePath() + '/user-marker.png'
                    });
                    map.panTo(marker.getPosition());
                }
            }).fail(function(data) {

            }).always(function() {
                //self.isLoading(false);
            });
        }

        function select_marker() {
            var id = jQuery('#chosen_point').val();
            for (var i = 0; i < mapMarkers.length; i++) {
                if (mapMarkers[i].id == id) {
                    mapMarkers[i].icon = mapMarkers[i].icon = mapMarkers[i].icon.replace('marker', 'selected');
                    map.panTo(mapMarkers[i].getPosition());
                    infowindow.close();
                    infowindow.setContent(contentString);
                    infowindow.open(map, mapMarkers[i]);
                } else {
                    mapMarkers[i].icon = mapMarkers[i].icon = mapMarkers[i].icon.replace('selected', 'marker');
                }
            }

            show_markers();
        }

        function translate(l) {
            translator.lang(l);
        }

        function clearOverlays() {
            for (var i = 0; i < mapMarkers.length; i++) {
                mapMarkers[i].setMap(null);
            }
            mapMarkers.length = 0;
        }

        function show_markers() {
            for (var i = 0; i < mapMarkers.length; i++) {
                mapMarkers[i].setMap(map);
            }
        }

        function select_item(obj) {
            jQuery('#chosen_point').val(obj.attr('data-value'));
            jQuery('#pickuppoint_choosen').val(jQuery('#chosen_point').val());
            contentString = obj.children('div.details_holder').html();
            jQuery(".item").removeClass("active");
            obj.addClass('active');
            select_marker();
            var service_points = component.service_points;
            for (var key in service_points) {
                if (service_points[key].key == obj.attr('data-code')) {
                    selected_method = {
                        method_code: key,
                        method_title: component.filters_details[obj.attr('data-code')].label,
                        method_price: obj.attr('data-price')
                    };
                    break;
                }
            }

            selected_pickuppoint_address[selected_method.method_code] = obj.attr('data-address');
            $.ajax({
                url: checkoutConfig.logxstar.pickuppoint.ajaxgetpoints_save,
                data: { 'point': obj.attr('data-value') },
                method: 'POST'
            }).done(function(response) {

            }).fail(function(data) {

            }).always(function() {

                formatMethod(true);
            });
        }

        function select_item_id(id) {
            var div;
            jQuery('.pickuppoint_item').each(function() {
                if (jQuery(this).data('value') == id) {
                    div = jQuery(this);
                    return false;
                }
            });
            if (div) {
                select_item(div);
            }
        }

        function arrayHasOwnIndex(array, key) {
            return array.hasOwnProperty(key) && /^0$|^[1-9]\d*$/.test(key) && key <= 4294967294;
        }

        function modal_submit() {
            jQuery('#choose-pickup-location').val(jQuery('#chosen_point').val());
            jQuery('#pickuppoint_choosen').val(jQuery('#chosen_point').val());
            infowindow.close();
            jQuery('#map-container').hide().removeClass('in');
            return false;
        }

        function capitalizeFirstLetter(string) {
            return string[0].toUpperCase() + string.slice(1);
        }

        function cartPickupPoint(click) {
            var pointText = '';
            var method_name = checkoutData.getSelectedShippingRate().method_code ? checkoutData.getSelectedShippingRate().method_code : selected_method.method_code;
            var checked_el = 'logxstar_' + method_name;
            var pickuppoint = checkoutData.getSelectedShippingRate().pickuppoint;

            var selected_el = $('input[value="' + checked_el + '"]');
            if (click) {
                selected_el.click();
            }
            //selected_el.closest('form').find('input').prop('checked', checked_el);

            if (pickuppoint != 'undefined') {
                pointText = '<p>(' + pickuppoint + ')</p>' +
                    '<p class="select_link">' + checkoutConfig.logxstar.pickuppoint.select_button + '</p>';
            }
            var element = $('#selected_method');
            if (element.length == 0) {
                selected_el.closest('tr').find('.col-method').eq(1).find('p').remove();
                selected_el.closest('tr').find('.col-method').eq(1).append(pointText);

            } else {
                element.html('<table class="table-checkout-shipping-method">' +
                    selected_el.closest('tr').html() +
                    '</table>'
                ).find('input').val('');
                element.find('.col-method').eq(1).append(pointText);
                $('#deliver_pickup').hide();
            }

            $('.select_link').on('click', function() {
                component.initTypes();
                component.type = 'pickup';
                component.showPopup();
            });
        }

        function formatMethod(click) {
            var pointText = '';
            var method_name = selected_method.method_code;
            var checked_el = 'logxstar_' + method_name;

            var selected_el = $('input[value="' + checked_el + '"]');
            if (click) {
                selected_el.click();
            }
            //selected_el.closest('form').find('input').prop('checked', checked_el);

            if (typeof selected_pickuppoint_address[selected_method.method_code] != 'undefined') {
                pointText = '<p>(' + selected_pickuppoint_address[selected_method.method_code] + ')</p>' +
                    '<p class="select_link">' + checkoutConfig.logxstar.pickuppoint.select_button + '</p>';
            }
            var element = $('#selected_method');
            if (element.length == 0) {
                selected_el.closest('tr').find('.col-method').eq(1).find('p').remove();
                selected_el.closest('tr').find('.col-method').eq(1).append(pointText);

            } else {
                element.html('<table class="table-checkout-shipping-method">' +
                    selected_el.closest('tr').html() +
                    '</table>'
                ).find('input').val('');
                element.find('.col-method').eq(1).append(pointText);
                $('#deliver_pickup').hide();
            }

            $('.select_link').on('click', function() {
                component.initTypes();
                component.type = 'pickup';
                component.showPopup();
            });
        }
        $.fn.translate = function(options) {
            var that = this;

            var settings = {
                css: "trn",
                lang: "nl",
                t: JSON.parse(checkoutConfig.logxstar.pickuppoint.dict)
            };
            settings = $.extend(settings, options || {});
            if (settings.css.lastIndexOf(".", 0) !== 0) //doesn't start with '.'
                settings.css = "." + settings.css;

            var t = settings.t;

            //public methods
            this.lang = function(l) {
                if (l) {
                    settings.lang = l;
                    this.translate(settings); //translate everything
                }
                return settings.lang;
            };


            this.get = function(index) {
                var res = index;

                try {
                    res = t[index][settings.lang];
                } catch (err) {
                    //not found, return index
                    return index;
                }

                if (res)
                    return res;
                else
                    return index;
            };

            this.g = this.get;

            //main
            this.find(settings.css).each(function(i) {
                var $this = jQuery(this);

                var trn_key = $this.attr("data-trn-key");
                if (!trn_key) {
                    trn_key = $this.html();
                    $this.attr("data-trn-key", trn_key); //store key for next time
                }

                $this.html(that.get(trn_key));
            });
            return this;
        };

        return Component.extend({
            ajaxpickuppoint: checkoutConfig.logxstar.pickuppoint.ajaxgetpoints,
            css_popup_url: checkoutConfig.logxstar.pickuppoint.css_popup,
            checkDelay: 5000,
            mocked: false,
            isPickupPointsComplete: null,
            pickupPointsRequest: null,
            selected_delivery: null,
            delivery_data: null,
            markers: [],
            type: 'pickup',
            filter_id: 'allID',
            service_points: null,
            filters_details: {
                'postnl': { 'label': 'POSTNL', 'logo': 'postnl_logo.png' },
                'ups': { 'label': 'UPS Express', 'logo': 'ups_logo.png' },
                'dpd_germany': { 'label': 'DPD', 'logo': 'dpd_logo.png' }
            },
            label_details: {
                'postnl': {
                    30: 'Express service',
                    36: 'Express service',
                    23: 'Avondlevering'
                },
                'dpd': {
                    80: 'Express service',
                    81: 'Express service',
                    82: 'Express service'
                }
            },
            current_method: null,
            current_method_name: null,
            postcode_field: null,
            last_response: null,
            inited: false,
            initialize: function() {
                this._super();
                //quote.shippingMethod.subscribe(this.shippingMethodUpdate, this);
                shippingService.isLoading.subscribe(this.addFreeShippingMessage, this);
                shippingService.isLoading.subscribe(this.hideShippingMethods, this);
                quote.totals.subscribe(this.hideShippingMethods, this);
                quote.totals.subscribe(this.addFreeShippingMessage, this);
                this.shippingMethodsUpdateFix(0);
                this.addStyles(this.css_popup_url);
                this.getServicePoints();
                component = this;


            },
            getServicePoints: function() {
                $.ajax({ url: this.ajaxpickuppoint }).done(function(response) {
                    var data = JSON.parse(response);
                    if (data == null) {
                        return false;
                    }
                    component.last_response = response;
                    component.service_points = data['methods_points'];
                    component.delivery_data = data['delivery_data'];
                    component.formatDelivery();
                    component.loadAllMarkers();
                }).fail(function(data) {
                    console.log(data);
                }).always(function() {});
            },
            formatDelivery: function() {
                var self = this;
                if (component.delivery_data != null) {
                    var left_items = '<ul class="deliverBlockList">';
                    var right_items = '<ul class="deliverBlockList">';
                    var delivery_data = self.delivery_data;
                    var price = [];
                    var todayDate = new Date();
                    var date_options = { weekday: 'long', day: '2-digit', month: 'long' };
                    for (var key in delivery_data) {

                        var date_parts = key.split('-');
                        var event = new Date(Date.UTC(date_parts[2], date_parts[1] - 1, date_parts[0]));
                        var day_diff = Math.floor((event - todayDate) / (1000 * 60 * 60 * 24));
                        var clearDateStr = event.toLocaleDateString('nl-NL', date_options);

                        if (day_diff == 0) {
                            var datestr = '<span class="trn">Morgen</span>';
                        } else {
                            var datestr = '<span class="trn">' +
                                capitalizeFirstLetter(event.toLocaleDateString('nl-NL', { weekday: 'long' })) + '</span>, ' +
                                capitalizeFirstLetter(event.toLocaleDateString('nl-NL', { day: '2-digit' })) + ' <span class="trn">' +
                                capitalizeFirstLetter(event.toLocaleDateString('nl-NL', { month: 'long' })) + '</span>';
                        }

                        left_items = left_items +
                            '<li class="leftList" data-item="' + key + '">' + datestr + '</li>';
                        jQuery.each(delivery_data[key], function(deliver_key, val) {

                            var delivery_details = val['carrier_code'];
                            if (typeof(price[val['carrier_id']]) != 'string') {
                                price[val['carrier_id']] = jQuery('#label_method_' + val['carrier_short'] + '_logxstar').parent().find('span.price:first').text();
                            }

                            var logo_name = val['carrier_code'];
                            if (logo_name == 'dpd_germany') {
                                logo_name = 'dpd';
                            }
                            var logo_url = 'https://os.logxstar.com/bundles/npdbase/img/plugins/pickup/' + logo_name + '_logo.png';
                            var carrier_label = '';

                            if (component.label_details[logo_name] != null && component.label_details[logo_name][val['carrier_id']] != null) {
                                carrier_label = component.label_details[logo_name][val['carrier_id']];
                            }

                            for (var time_frame in val['time_frames']) {

                                var time = val['time_frames'][time_frame].replace('Available: ', '');
                                right_items = right_items +
                                    '<li class="rightList" data-carrier-id="' + val['carrier_id'] + '" data-carrier-short="' + val['carrier_short'] + '" data-delivery-date="' + key + '" data-delivery-time="' + time + '" data-date-text="' + clearDateStr + '"><span class="col-lg-6 col-sm-10 delivery_date">' +
                                    '<img src="' + logo_url + '">' + datestr + ', ' + time + '</span>';
                                if (carrier_label.length > 0) {
                                    right_items = right_items + '<span class="carrier_label">' + carrier_label + '</span>';
                                }
                                right_items = right_items + '<span class="col-lg-2 price">' + price[val['carrier_id']] + '</span></li>';

                            }
                        });

                    }
                    left_items = left_items + '</ul>';
                    right_items = right_items + '</ul>';
                    jQuery('#deliver-modal-items').html(left_items);
                    jQuery('#deliver-details').html(right_items);
                    component.initDevActions();

                    if (component.selected_delivery != null) {
                        jQuery('.rightList, .leftList').removeClass('active');
                        jQuery('.rightList[data-delivery-date="' + component.selected_delivery.date + '"]').addClass('active');
                        jQuery('#deliver-modal-items li[data-item="' + component.selected_delivery.date + '"]').addClass('active');
                    } else {
                        jQuery('#deliver-modal-items li:first').click();
                    }
                }
            },
            initOptions: function() {
                if (component.inited == true) {
                    return true;
                }
                jQuery('td[id*="__logxstardelivery_logxstar"]').each(function() {
                    jQuery(this).closest('tr').on('click', function() {
                        component.type = 'deliver';
                        component.showPopup();
                    });
                });
                component.inited = true;
            },
            initDevActions: function() {
                jQuery('.leftList').off('click').on('click', function() {

                    jQuery('.rightList, .leftList').removeClass('active');

                    jQuery('.rightList[data-delivery-date="' + jQuery(this).data('item') + '"]').addClass('active');
                    jQuery(this).addClass('active');
                });

                /** Set info about delivery option / Send form  */
                jQuery('.deliverBlockList li.rightList').off('click').on('click', function() {

                    var carrier_id = jQuery(this).data('carrier-id');
                    var time = jQuery(this).data('delivery-time');
                    var date = jQuery(this).data('delivery-date');
                    var datestr = jQuery(this).data('date-text');
                    var carrier_short = jQuery(this).data('carrier-short');


                    //jQuery("input[id*='__"+carrier_id+"__logxstardelivery']").trigger('click');
                    jQuery("p.delivery_details").remove();

                    jQuery('#label_method_' + carrier_short + '_logxstar').append('<p class="delivery_details">' + datestr + '</p>').trigger('click');

                    component.selected_delivery = { 'id': carrier_id, 'date': date, 'text': datestr };
                    //save selected date/time

                    $.ajax({
                        url: checkoutConfig.logxstar.pickuppoint.ajaxdeliverydate_save,
                        data: { 'time': time, 'date': date, 'carrier_id': carrier_id },
                        method: 'POST'
                    }).done(function(response) {

                    }).fail(function(data) {

                    }).always(function() {

                    });

                    component.initOptions();
                    infowindow.close();
                    jQuery('#map-container').hide().removeClass('in');

                    return false;
                });
            },
            shippingMethodsUpdateFix: function(i) { //fix onestepcheckout problem - shipping methods do not update on postcode change
                var self = this;
                if (i < 30 && !self.postcode_field) {
                    setTimeout(function() {
                        var tmp = jQuery('input[name="postcode"]');
                        if (!tmp.length) {
                            self.shippingMethodsUpdateFix(i++);
                        } else {
                            self.postcode_field = tmp;
                            var e = registry.get('checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset');
                            var d = e.elems();
                            shippingRatesValidator.bindChangeHandlers(d);
                        }
                    }, 1000);
                }
            },
            shippingMethodUpdate: function(method) {

                if (typeof method != 'undefined' && method !== null) {
                    var method_name = method.method_code;
                }

                this.addFreeShippingMessage();

                if (typeof method_name != 'undefined' && method_name !== null && method_name.indexOf('lgxspickup') !== -1) {
                    selected_method = method;
                    formatMethod();
                }
                if (this.current_method_name != method_name) {
                    this.last_response = null;
                    this.current_method_name = method_name;
                }
            },
            hideShippingMethods: function() {
                var hideTimer = setTimeout(function() {
                    component.getServicePoints();

                    if ($('input[value$="__lgxspickup"]').length > 1) {
                        $('input[value$="__lgxspickup"]').closest('tr').hide();
                        var selected_el = jQuery('#checkout-step-shipping_method')
                            .find('input[type="radio"][value^="logxstar"]:checked:not([value$="__lgxspickup"])');
                        jQuery('#checkout-step-shipping_method')
                            .find('input[type="radio"]:not([value$="__lgxspickup"])')
                            .parent()
                            .parent()
                            .on('click', function() {
                                $('#pickup_mock_up').find('input').prop('checked', false);
                            });
                        if (component.mocked == false || selected_el.length > 0) {
                            jQuery('#pickup_mock_up').remove();
                            $('#checkout-shipping-method-load').after(
                                '<div id="pickup_mock_up">' +
                                '<div id="deliver_pickup" class="selectPickuppoint">' +
                                '<table class="table-checkout-shipping-method">' +
                                '<tr class="row">' +
                                '<td class="col col-method">' +
                                '<input type="radio" class="radio" >' +
                                '</td>' +
                                '<td class="col col-price">&nbsp;' +
                                '</td>' +
                                '<td class="col col-method">' +
                                'Bent u morgen niet thuis?<br/>' + checkoutConfig.logxstar.pickuppoint.select_button +
                                '</td>' +
                                '<td class="col col-carrier"></td>' +
                                '</tr>' +
                                '</table>' +
                                '</div >' +
                                '<div id="selected_method" class="selectPickuppoint">' +
                                '</div>' +
                                '</div>');
                            $('#pickup_mock_up').off('click').on('click', '.selectPickuppoint', function() {
                                component.initTypes();
                                component.type = 'pickup';
                                component.loadPickupPoints();
                                component.showPopup();
                            });
                            component.mocked = true;
                            if (typeof checkoutData.getSelectedShippingRate().pickuppoint != 'undefined') {
                                cartPickupPoint(true);
                            }
                        } else {

                        }
                        clearTimeout(hideTimer);
                    } else if (
                        component.service_points != null &&
                        Object.keys(component.service_points).length > 0 &&
                        typeof $('input[value$="__lgxspickup"]') != 'undefined' &&
                        $('input[value$="__lgxspickup"]').length == 1

                    ) {

                        var key = Object.keys(component.service_points)[0];
                        var point = component.service_points[key].points[0];
                        selected_method = {
                            method_code: key,
                            method_title: component.filters_details[point.carrier].label,
                            method_price: point.price
                        };

                        var data_address = [
                            point.address_data.name,
                            point.address_data.street + ' ' + point.address_data.housenr,
                            formatZip(point.address_data.zipcode),
                            point.address_data.city,
                            $.mage.__('Distance') + ' ' + point.address_data.distance + 'm'
                        ];

                        data_address = data_address.join(', ');
                        selected_pickuppoint_address[selected_method.method_code] = data_address;
                        $.ajax({
                            url: checkoutConfig.logxstar.pickuppoint.ajaxgetpoints_save,
                            data: { 'point': point.id },
                            method: 'POST'
                        }).done(function(response) {

                        }).fail(function(data) {

                        }).always(function() {
                            //self.isLoading(false);

                            formatMethod(!component.mocked);

                            component.mocked = true;
                        });
                        clearTimeout(hideTimer);

                    }

                }, 1000);
            },
            addFreeShippingMessage: function() {
                clearTimeout(freeMessageTimer);
                var freeMessageTimer = setTimeout(function() {
                    var freeshipping_data = window.checkoutConfig.logxstar.pickuppoint.freeshipping_data;
                    var shippingAddress = quote.shippingAddress();
                    if (typeof freeshipping_data[shippingAddress.countryId] != 'undefined') {
                        var free_message = freeshipping_data[shippingAddress.countryId]['free_message'];
                        var free_value = parseFloat(freeshipping_data[shippingAddress.countryId]['free_value']);
                        var includeTax = window.checkoutConfig.logxstar.pickuppoint.freeshipping_tax;
                        var totals = quote.getTotals();
                        var subtotal = parseFloat(totals().subtotal);
                        if (includeTax == '1') {
                            subtotal = parseFloat(totals().subtotal_incl_tax);
                        }
                        if (subtotal < free_value) {
                            var shipping_rates = shippingService.getShippingRates();
                            var rates = shipping_rates();
                            var skip = false;
                            var logxstar_method = 0;
                            var first_logxstar = $('[id^="s_method_logxstar_"]').first().closest('tr');
                            var extra_value = free_value - subtotal;
                            var extra_value = priceUtils.formatPrice(extra_value, quote.getPriceFormat());
                            free_message = free_message.replace(/{{extra_value}}/gi, extra_value);

                            if (!$('#logxstar_free_message').length) {
                                first_logxstar.before('<tr><td colspan="4" style="color:red"  id="logxstar_free_message">' + free_message + '</td></tr>');
                            } else {
                                $('#logxstar_free_message').text(free_message);
                            }
                        }
                    }
                }, 1000);
            },
            showPopup: function() {
                var self = this;
                self.addCloseButtonsEventListeners();
                //self.loadPickupPoints();
                self.loadFilters();
                self.loadLangs();
                self.showType();
                jQuery('#map-container').show().addClass('in');
            },
            initTypes: function() {
                jQuery('button.delivery-type').off('click').on('click', function() {
                    component.type = jQuery(this).data('type');
                    component.showType();
                });
            },
            formatOptions: function() {
                var option = jQuery('input[id*="__' + component.selected_delivery.id + '__logxstardelivery');
                if (option.prop('checked')) {
                    jQuery('label[for*="__' + component.selected_delivery.id + '__logxstardelivery"]').append('<br/><span class="delivery_details">' + component.selected_delivery.text + '</span>');
                }
                //component.initOptions();
            },
            showType: function() {
                var self = this;
                if (component.service_points.length != 0) {
                    jQuery('#delivery_types [data-type="pickup"]').removeClass('hidden');
                } else {
                    jQuery('#delivery_types [data-type="pickup"]').addClass('hidden');

                }
                if (component.delivery_data.length != 0) {
                    jQuery('#delivery_types [data-type="deliver"]').removeClass('hidden');
                } else {
                    jQuery('#delivery_types [data-type="deliver"]').addClass('hidden');
                }
                jQuery('#delivery_types .delivery-type').removeClass('selected');
                jQuery('#delivery_types .delivery-type[data-type="' + component.type + '"]').addClass('selected');
                jQuery('.type-content').hide();
                jQuery('.type-content.' + component.type + '-type').show();
                if (component.type == 'deliver' || jQuery('#points_filter button').length == 0) {
                    jQuery('.filters').addClass('hidden');
                    jQuery('#header_logo').removeClass('hidden');
                } else {
                    jQuery('#header_logo').addClass('hidden');
                    jQuery('.filters').removeClass('hidden');
                }
            },
            loadPickupPoints: function() {
                var self = this;
                if (self.markers.length) {
                    initMap(self.markers);
                }
            },
            loadAllMarkers: function() {
                var self = this;
                var points = [];
                var service_points = self.service_points;
                for (var key in service_points) {
                    points = points.concat(service_points[key].points);

                }

                var pointsByDistance = points.slice(0);
                pointsByDistance.sort(function(a, b) {
                    return a.address_data.distance - b.address_data.distance;
                });

                self.markers = pointsByDistance;
            },
            loadSelectedMarkers: function(key) {
                var self = this;
                var points = [];
                var service_points = self.service_points;
                if (service_points[key].points != 'undefined' && service_points[key].points.length > 0) {
                    points = service_points[key].points;
                }
                self.markers = points;
            },
            loadFilters: function() {
                var self = this;
                var filters = [];
                var service_points = self.service_points;
                self.loadLangs();
                for (var key in service_points) {
                    filters.push(key);
                }
                if (service_points.length == 0) {
                    jQuery('.filters').addClass('hidden');
                    jQuery('#header_logo').removeClass('hidden');
                    return false;
                }
                $('#points_filter').html('');
                if (filters.length < 2) {
                    jQuery('.filters').addClass('hidden');
                    jQuery('#header_logo').removeClass('hidden');
                    self.loadPickupPoints();
                    return false;
                } else {
                    $('#points_filter').html('<div class="btn-group"></div>');
                    $('#points_filter .btn-group').append('\
                                    <button id="allID" class="btn btn-default primary filter-cc" type="button">\
                                    All</button>\
                                ');
                    for (var key in filters) {
                        if (arrayHasOwnIndex(filters, key)) {
                            $('#points_filter .btn-group').append('\
                                    <button id="' + filters[key] + '" class="btn btn-default primary filter-cc" type="button" style="\
background-image: url(' + self.getImagePath() + '/' + self.filters_details[service_points[filters[key]].key].logo + ') !important;">\
                                    <span>' + self.filters_details[service_points[filters[key]].key].label + '</span>\
                                    </button>\
                                ');
                        }
                    }
                    $('#' + self.filter_id).addClass('selected');
                    $('#points_filter button').click(function() {

                        if (this.id == 'allID') {
                            self.loadAllMarkers();
                        } else {
                            self.loadSelectedMarkers(this.id);
                        }
                        $('#points_filter button').removeClass('selected');

                        $('#' + this.id).addClass('selected');
                        self.filter_id = this.id;
                        clearOverlays();
                        self.loadPickupPoints();
                        return false;
                    });
                    return true;
                }
            },
            loadLangs: function() {
                var self = this;
                var selected_lang = $('#selected_lang').val();
                jQuery('#' + selected_lang).addClass('selected');
                $('#langs button').click(function() {
                    $('#langs button').removeClass('selected');
                    $('#' + this.id).addClass('selected');
                    $('#selected_lang').val(this.id);
                    translate(this.id);
                    return false;
                });
                translator = $('#map-container').translate({ lang: selected_lang });
                return true;
            },
            addCloseButtonsEventListeners: function() {
                jQuery('#pickup_container .close').on('click', function() {
                    infowindow.close();
                    jQuery('#map-container').hide().removeClass('in');
                });

                jQuery('body').on('click', '#pickup_container .ls_modal_submit', function(e) {
                    modal_submit();
                    return false;
                });
            },
            addStyles: function(url) {
                var link = document.createElement("link");
                link.type = "text/css";
                link.rel = "stylesheet";
                link.href = url;
                document.getElementsByTagName("head")[0].appendChild(link);
            },
            getImagePath: function() {
                return checkoutConfig.logxstar.pickuppoint.image_path;
            },
            getHeaderLogoSrc: function() {
                return checkoutConfig.logxstar.pickuppoint.header_logo_src;
            }
        });
    }
);
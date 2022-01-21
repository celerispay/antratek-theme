/**
 * Euvat VAT ID Client Library
 *
 * @author     PILLWAX Industrial Solutions Consulting
 * @category   Pisc
 * @package    Pisc_Euvat
 * @copyright  Copyright (c) 2016 PILLWAX Industrial Solutions Consulting (http://technology.pillwax.com/software)
 * @license    Commercial Unlimited License (http://technology.pillwax.com/software/license)
 * @version    2.0.11
 */

 define([
  "underscore",
  "jquery",
  'mage/validation',
  "mage/mage",
  "mage/translate",
  "mage/cookies"
], function(_, $){
  "use strict";

  $.widget('euvat.vatid', {

    options: {
       ajaxUrl: null,
       sessionId: null,
       formKey: null,
       messageElementId: '#euvat_validation_message',
       taxvatElementId: null,
       vatprefixElementId: null,
       submitElementId: null,
      taxvatSaveInQuote: false,
      formElements: {
        template:{},
        billing:{
          company:'billing:company',
          street:'billing:street1',
          postcode:'billing:postcode',
          city:'billing:city',
          country:'billing:country_id',
          taxvat:'billing:taxvat'
        },
        shipping:{
          company:'shipping:company',
          street:'shipping:street1',
          postcode:'shipping:postcode',
          city:'shipping:city',
          country:'shipping:country_id',
          taxvat:'shipping:taxvat'
        }
      },
      countryPrefix: null,
      mustMatchCountry: false,
      isRequired: false,
      addressCountryVisibility: null,
      showForCountries: null,
      requiredForCountries: null,
      associatedCountries: null,
      timeout: 5000,
      additional: {}
    },

    _create: function() {

        $.validator.addMethod(
          'validate-eu-vat-id-syntax',
          this.validateEuVatIdSyntax,
          $.mage.__('Please verify the EU VAT Identification Number, it seems to be incomplete or incorrectly entered')
        );

        $.validator.addMethod(
          'validate-eu-vat-id-country-match',
          this.validateEuVatIdMatchesCountry,
          $.mage.__('The EU VAT Identification Number must match to the current selected Address Country')
        );

        if (this.options.additional.formElements) {
          this.options.formElements.template = this.options.additional.formElements;
        }
        if (this.options.taxvatElementId && !this.options.formElements.template.taxvat) {
          this.options.formElements.template.taxvat = this.options.taxvatElementId;
        }
        if (!this.options.taxvatElementId && this.element) {
          this.options.taxvatElementId = '#'+this.element.attr('id');
        }
        if (!this.options.formKey) {
          this.options.formKey = $.mage.cookies.get('form_key');
        }
        if (this.options.taxvatElementId) {
            this._observeTaxvat(this.options.taxvatElementId);
        }
        
        window.PiscEuvatValidationConfig = {
          countryPrefix: this.options.countryPrefix,
          associatedCountries: this.options.associatedCountries,
          formElements: this.options.formElements
        };  
        
        this._bind();
    },

    _bind: function() {
      if (this.options.vatprefixElementId) {
          $(this.options.vatprefixElementId).on('change', $.proxy(function(event) {
            this._observeVatPrefix(event.target);
          }, this));
      }
      if (this.options.formElements.template.country && ((this.options.showForCountries && this.options.showForCountries.length>0) || this.options.mustMatchCountry || this.options.requiredForCountries)) {
        var el = this.getFormElement(this.options.formElements.template.country);
        if (el) {
          $(el).on('change', $.proxy(function(event) {
            this._observeCountryId(event.target);
          }, this));
        this._observeCountryId(el);
        }
      }
      $(this.options.taxvatElementId).on('change', $.proxy(function(event) {
      this._observeTaxvat(event.target);
      }, this));
      $(this.options.taxvatElementId).on('keyup', $.proxy(function(event) {
      this._observeTaxvat(event.target);
      }, this));
      if (this.options.submitElementId) {
          $(this.options.submitElementId).on('click', $.proxy(function(event) {
            event.preventDefault();
            event.stopPropagation();
            this.validateEuVatId();
          }, this));
      }
    },

    _observeVatPrefix: function(sourceElement) {
    var el = $(sourceElement).get(0);
    var country = this.options.formElements.template.country?this.getFormElement(this.options.formElements.template.country):null;

    if (!el && this.options.vatprefixElementId) {
      var el = $(this.options.vatprefixElementId).get(0);
    }
    if (el && this.options.taxvatElementId) {
      var taxvat = $(this.options.taxvatElementId).get(0);
      var prefix = (taxvat.length>1)?taxvat.value.substring(0,2):null;

      if (el.value.length==2 && prefix!=el.value) {
        $(this.options.taxvatElementId).get(0).value = el.value;
        $(this.options.taxvatElementId).focus();
      } else if (el.value.length<2) {
        $(this.options.taxvatElementId).get(0).value = '';
      }
      if (sourceElement && this.options.mustMatchCountry && country) {
        var option = this.getCountryIdFromVatPrefix(el.value);
        if (option) {
          $(country).val(option).change();
        }
      }
      $(this.options.messageElementId).html('');
      this._observeTaxvat(this.options.taxvatElementId);
    }
    },

    _observeTaxvat: function(sourceElement) {
    var el = $(sourceElement).get(0);
    if (el) {
      var vatId = el.value.toUpperCase().replace(' ','');
      if (vatId!=el.value) {
        el.value = vatId;
        $(this.options.messageElementId).html('');
      }
      if (this.options.submitElementId) {
          (el.value.length>2)?$(this.options.submitElementId).show():$(this.options.submitElementId).hide();
      }

      if (this.options.vatprefixElementId) {
          var countryPrefix = this.options.vatprefixElementId?$(this.options.vatprefixElementId).get(0):null;

        if (countryPrefix) {
              if (el.value.length>1) {
                var prefix = el.value.substring(0,2);
                if (prefix.length==2 && this.getCountryIdFromVatPrefix(prefix)) {
                    $(countryPrefix).val(prefix);
                } else {
                  $(countryPrefix).val('X');
                }
              } else if (el.value.length==0) {
                $(countryPrefix).val('X');
              }
        }
      }
    }
    },

    _observeCountryId: function(sourceElement)	{
      var vatid = this.options.taxvatElementId?$(this.options.taxvatElementId).get(0):null;
      var country = $(sourceElement).get(0);
      var countryPrefix = this.options.vatprefixElementId?$(this.options.vatprefixElementId).get(0):null;
    var associatedEuCountry = this.getAssociatedEuCountry(country.value);
      var required = this.options.isRequired;

        if (associatedEuCountry) {
          if (this.options.mustMatchCountry && this.options.countryPrefix && countryPrefix) {
            var option = _.property(associatedEuCountry)(this.options.countryPrefix);
          if (option && countryPrefix.value.length==2 && countryPrefix.value!=option.value) {
              $(countryPrefix).val(option.value).change();
            }
          }

        if (this.options.showForCountries && this.options.showForCountries.length>0) {
          (this.options.showForCountries.indexOf(associatedEuCountry)>=0)?$('#euvat-vatid-field').show():$('#euvat-vatid-field').hide();
        } else {
          $('#euvat-vatid-field').show();
        }

      if (required==true) {
        if (typeof(this.options.requiredForCountries)!='undefined' && this.options.requiredForCountries.length>0) {
          required = (this.options.requiredForCountries.indexOf(associatedEuCountry) >= 0);
        }
      }
        } else {
          required = false;
      if (this.options.showForCountries) { $('#euvat-vatid-field').hide(); }
        }
        if (required==true) {
      $('#euvat-vatid-field').show()
      $('#euvat-vatid-field').addClass('required');
      $(this.options.taxvatElementId).addClass('required-entry');
        } else {
      $('#euvat-vatid-field').removeClass('required');
      $(this.options.taxvatElementId).removeClass('required-entry');
        }
    },

    validateEuVatId: function(taxvat) {
      if (typeof(taxvat)=='undefined' && this.options.taxvatElementId) {
        var el = $(this.options.taxvatElementId).get(0)
        if (el) { taxvat = el.value; }
      }

      var billingCountry = null;
      var shippingCountry = null;
      if (this.options.formElements.billing && this.options.formElements.billing.country && (el = this.getFormElement(this.options.formElements.billing.country))) { billingCountry = el.value; }
      if (this.options.formElements.shipping && this.options.formElements.shipping.country && (el = this.getFormElement(this.options.formElements.shipping.country))) { shippingCountry = el.value; }
      if (this.options.formElements.template && this.options.formElements.template.country && this.options.additional.taxbase && (el = this.getFormElement(this.options.formElements.template.country))) {
        if (this.options.additional.taxbase=='billing') { billingCountry = el.value; }
        else if (this.options.additional.taxbase=='shipping') { shippingCountry = el.value; }
      }

      var requestParams = {
                'form_key':this.options.formKey,
                'vatid':taxvat,
                'billing_country':billingCountry,
                'shipping_country':shippingCountry,
                'taxvatSaveInQuote':this.options.taxvatSaveInQuote
        };
      $.extend(requestParams, this.options.additional);
        var updater = new $.ajax({
              url: this.options.ajaxUrl+'ValidateVatid?SID='+this.options.sessionId,
                    method:'post',
                    data: requestParams,
                    timeout: this.options.timeout,
                  beforeSend:function(){
                $(this.options.messageElementId).html('<div class="euvat euvat-message euvat-taxvat-validation-progress">'+$.mage.__('One Moment, we are validating this EU VAT Identification Number...')+'</div>');
                if (this.options.taxvatElementId) { $(this.options.taxvatElementId).prop('disabled', true); }
                if (this.options.vatprefixElementId) { $(this.options.vatprefixElementId).prop('disabled', true) }
                if (this.options.submitElementId) { $(this.options.submitElementId).hide(); }
                }.bind(this),
                success:function(response){
                  if (response.html) {
                    $(this.options.messageElementId).html(response.html);
                  } else {
                      $(this.options.messageElementId).html('<div class="euvat euvat-message euvat-taxvat-validation-failure">'+$.mage.__('Sorry, currently we are unable to validate this EU VAT Identification Number')+'</div>');
                  }
                  if (response.result) {
                    var el = $(this.options.formElements.template.taxvat).get(0);
                    if (el && response.result.countryCode && response.result.vatNumber) {
                      el.value = response.result.countryCode + response.result.vatNumber;
                    }
                  }
                  if (response.trader) { this.updateCheckoutForm(response); }
                  $(document).trigger("euvatVatIdValidateResponse", response);
                }.bind(this),
                error:function(response){
                  $(this.options.messageElementId).html('<div class="euvat euvat-message euvat-taxvat-validation-failure">'+$.mage.__('Sorry, currently we are unable to validate this EU VAT Identification Number')+'</div>');
                }.bind(this),
                complete:function(){
                if (this.options.taxvatElementId) { $(this.options.taxvatElementId).prop('disabled', false); }
                if (this.options.vatprefixElementId) { $(this.options.vatprefixElementId).prop('disabled', false) }
                  if (this.options.submitElementId) { $(this.options.submitElementId).show(); }
                  if (this.options.additional.checkout=='Idev_OneStepCheckout' && $('onestepcheckout-form') && typeof get_save_billing_function=='function') {
                    /* OneStepCheckout: Update Summary */
                    get_save_billing_function(this.options.additional.url_save_billing, this.options.additional.url_set_methods, true, true)();
                  }
                  if (this.options.additional.checkout=='FME_QuickCheckout' && $('onestepcheckout-form')) {
                    /* FME One Step Checkout */
                              billing.saveCountry();
                  }
                }.bind(this)
                }
            );
    },

    setFormElements: function(section, elements) {
      this.options.formElements[section] = elements;
    },

    getFormElement: function(selector) {
      var element = null;
      var selection = $("[name='"+selector+"']");
      if (selection && selection.length>0) { element = selection.get(0); }
      else {
        var selection = $("[id='"+selector+"']");
        if (selection && selection.length>0) { element = selection.get(0); }
      }
      return element;
    },

    getCountryIdFromVatPrefix: function(prefix) {
      var country = null;
      if (prefix && this.options.countryPrefix && prefix.length==2) {
          _.each(this.options.countryPrefix, function(item, key) {
            if (item.value==prefix) { country = key; }
          });
      }
      return country;
    },

    getAssociatedEuCountry: function(country) {
      var result = null;

      if (this.options.associatedCountries && country.length == 2) {
        // Determine associated EU Country Code
        _.each(this.options.associatedCountries, function(item, key) {
          if ((typeof(item)=='object' && item.length>0 && item.indexOf(country) >= 0)
              || (typeof(item)=='string' && item==country)) {
            result = key;
          }
        });
      }

      return result;
    },

    updateCheckoutForm: function(data) {
      if ((el=$(this.options.formElements[data.taxbase]['company'])) && data.trader.company) { el.value = data.trader.company; }
      if ((el=$(this.options.formElements[data.taxbase]['street'])) && data.trader.street) { el.value = data.trader.street; }
      if ((el=$(this.options.formElements[data.taxbase]['postcode'])) && data.trader.postcode) { el.value = data.trader.postcode; }
      if ((el=$(this.options.formElements[data.taxbase]['city'])) && data.trader.city) { el.value = data.trader.city; }
      if ((el=$(this.options.formElements[data.taxbase]['country_id'])) && data.trader.city) { el.value = data.trader.country; }
    },

      validateEuVatIdSyntax: function(value, params, additionalParams)
      {
        var countryCode = null;
        var vatId = null;
        var syntaxOk = false;

        if (!$(params).hasClass('required-entry') && value.length==0) {
          return true;
        }

        var matches = value.match('^[A-Z]{2}');
        if (matches && matches.length>0) {
          countryCode = matches[0];
          var part = value.substring(countryCode.length);
            var matches = part.match('[0-9A-Za-z\+\*\.]{2,12}');
            if (matches && matches.length>0) {
              vatId = matches[0];
            }
        }

        if (countryCode && vatId) {

            switch(countryCode) {
              case 'AT':
                  syntaxOk = vatId.match(/^U[0-9]{8}$/g)!==null;
                  break;
              case 'BE':
                  syntaxOk = vatId.match(/^0[0-9]{9}$/g)!==null;
                  break;
              case 'BG':
                  syntaxOk = vatId.match(/^[0-9]{9,10}$/g)!==null;
                  break;
              case 'CY':
                  syntaxOk = vatId.match(/^[0-9]{8}[A-Z]$/g)!==null;
                  break;
              case 'CZ':
                  syntaxOk = vatId.match(/^[0-9]{8,10}$/g)!==null;
                  break;
              case 'DE':
                  syntaxOk = vatId.match(/^[0-9]{9}$/g)!==null;
                  break;
              case 'DK':
                  syntaxOk = vatId.match(/^[0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}$/g)!==null;
                  syntaxOk = syntaxOk || vatId.match(/^[0-9]{2}[0-9]{2}[0-9]{2}[0-9]{2}$/g)!==null;
                  break;
              case 'EE':
                  syntaxOk = vatId.match(/^[0-9]{9}$/g)!==null;
                  break;
              case 'EL':
                  syntaxOk = vatId.match(/^[0-9]{9}$/g)!==null;
                  break;
              case 'ES':
                  syntaxOk = vatId.match(/^[A-Z0-9][0-9]{7}[A-Z0-9]$/g)!==null;
                  break;
              case 'FI':
                  syntaxOk = vatId.match(/^[0-9]{8}$/g)!==null;
                  break;
              case 'FR':
                  syntaxOk = vatId.match(/^[A-Z0-9]{2} [0-9]{9}$/g)!==null;
                  syntaxOk = syntaxOk || vatId.match(/^[A-Z0-9]{2}[0-9]{9}$/g)!==null;
                  break;
              case 'GB':
                  syntaxOk = vatId.match(/^[0-9]{3} [0-9]{4} [0-9]{2}$/g)!==null;
                  syntaxOk = syntaxOk || vatId.match(/^[0-9]{3}[0-9]{4}[0-9]{2}$/g)!==null;

                  syntaxOk = syntaxOk || vatId.match(/^[0-9]{3} [0-9]{4} [0-9]{2} [0-9]{3}$/g)!==null;
                  syntaxOk = syntaxOk || vatId.match(/^[0-9]{3}[0-9]{4}[0-9]{2}[0-9]{3}$/g)!==null;

                  syntaxOk = syntaxOk || vatId.match(/^GD[0-9]{3}$/g)!==null;
                  syntaxOk = syntaxOk || vatId.match(/^HA[0-9]{3}$/g)!==null;
                  break;
              case 'HU':
                  syntaxOk = vatId.match(/^[0-9]{8}$/g)!==null;
                  break;
              case 'IE':
                  syntaxOk = vatId.match(/^(\d{7}[A-W])$/g)!==null;
                  syntaxOk = syntaxOk || vatId.match(/^([7-9][A-Z\*\+)]\d{5}[A-W])$/g)!==null;
                  syntaxOk = syntaxOk || vatId.match(/^(\d{7}[A-W][AH])$/g)!==null;
                  break;
              case 'IT':
                  syntaxOk = vatId.match(/^[0-9]{11}$/g)!==null;
                  break;
              case 'LT':
                  syntaxOk = vatId.match(/^[0-9]{9}$/g)!==null;
                  syntaxOk = syntaxOk || vatId.match(/^[0-9]{12}$/g)!==null;
                  break;
              case 'LU':
                  syntaxOk = vatId.match(/^[0-9]{8}$/g)!==null;
                  break;
              case 'LV':
                  syntaxOk = vatId.match(/^[0-9]{11}$/g)!==null;
                  break;
              case 'MT':
                  syntaxOk = vatId.match(/^[0-9]{8}$/g)!==null;
                  break;
              case 'NL':
                  syntaxOk = vatId.match(/^[0-9]{9}B[0-9]{2}$/g)!==null;
                  break;
              case 'PL':
                  syntaxOk = vatId.match(/^[0-9]{10}$/g)!==null;
                  break;
              case 'PT':
                  syntaxOk = vatId.match(/^[0-9]{9}$/g)!==null;
                  break;
              case 'RO':
                  syntaxOk = vatId.match(/^[0-9]{2,10}$/g)!==null;
                  break;
              case 'SE':
                  syntaxOk = vatId.match(/^[0-9]{12}$/g)!==null;
                  break;
              case 'SI':
                  syntaxOk = vatId.match(/^[0-9]{8}$/g)!==null;
                  break;
              case 'SK':
                  syntaxOk = vatId.match(/^[0-9]{10}$/g)!==null;
                  break;
              case 'HR':
                  syntaxOk = vatId.match(/^[0-9]{11}$/g)!==null;
                  break;
            }
        }

          return syntaxOk;
      },

      validateEuVatIdMatchesCountry: function(value, params, additionalParams)
      {
        var result = false;
        var country = null;
        var countryPrefix = null;
        var countryPrefixes = null;
        var vatidPrefix = null;

        if (!$(params).hasClass('required-entry') && value.length==0) {
          return true;
        }

        if (window.PiscEuvatValidationConfig && window.PiscEuvatValidationConfig.countryPrefix) {
          var countryPrefixes = [];
          _.each(window.PiscEuvatValidationConfig.countryPrefix, function(item, key) {
            if (item.value.length==2) {
              countryPrefixes[key] = item.value;
            }
          });
        }

        if (window.PiscEuvatValidationConfig && window.PiscEuvatValidationConfig.formElements) {
          var el = $('[name="'+window.PiscEuvatValidationConfig.formElements.template.country+'"]').get(0);
          if (el) {
              var country = el.value;
          }
        }
        if (country===null) { return true; /* Pass validation in case we do not find Country field */ }

        if (window.PiscEuvatValidationConfig && window.PiscEuvatValidationConfig.associatedCountries) {
        // Determine associated EU Country Code
        _.each(window.PiscEuvatValidationConfig.associatedCountries, function(item, key) {
          if ((typeof(item)=='object' && item.length>0 && item.indexOf(country) >= 0)
              || (typeof(item)=='string' && item==country)) {
            country = key;
          }
        });
        }
        
        var matches = value.match('^[A-Z]{2}');
        if (matches && matches.length>0) {
          vatidPrefix = matches[0];
        }

        if (vatidPrefix!==null && countryPrefixes) {
          if (typeof(countryPrefixes[country])!=='undefined') {
            result = (countryPrefixes[country]==vatidPrefix);
          }
        }

        return result;
      }

  });

  return $.euvat.vatid;
});

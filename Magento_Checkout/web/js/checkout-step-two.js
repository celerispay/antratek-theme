

define([
  'jquery'
], function ($) {
  "use strict";
  return function checkoutStepTwo() {

    function updateFeedbackFactory(selector, maxLength, length) {
      return function() {
          $(selector).css('display','block');
          $(selector).html('Remaining Characters: ' + (maxLength - length));
      }
    }

    function attachCompanyListener(){
      var compIntl = setInterval(function(){
        var company = $('#co-shipping-form .field[name="shippingAddress.company"] input[name="company"]');

        if(company.length > 0){
          company.closest('.field').append('<p id="remComp" class="remChar">Remaining Characters: 35</p>');
          company.on('keypress', function(){
            if(this.value.length >= 35) return false;
            else updateFeedbackFactory('#remComp', 35, this.value.length)();
          }).on('keydown', function(){
            updateFeedbackFactory('#remComp', 35, this.value.length)();
          }).on('keyup', function(){
            updateFeedbackFactory('#remComp', 35, this.value.length)();
          });
          
          clearInterval(compIntl);
        }
      }, 400);
    }

    function attachExtraInfoListener(){
      var extraIntl = setInterval(function(){
        var extraInfo = $('#co-shipping-form .field[name="shippingAddress.bss_custom_field[business_additional]"] input[name="bss_custom_field[business_additional]"]');

        if(extraInfo.length > 0){
          extraInfo.closest('.field').append('<p id="remExtraInfo" class="remChar">Remaining Characters: 35</p>');
          extraInfo.on('keypress', function(){
            if(this.value.length >= 35) return false;
            else updateFeedbackFactory('#remExtraInfo', 35, this.value.length)();
          }).on('keydown', function(){
            updateFeedbackFactory('#remExtraInfo', 35, this.value.length)();
          }).on('keyup', function(){
            updateFeedbackFactory('#remExtraInfo', 35, this.value.length)();
          });

          clearInterval(extraIntl);
        }
      }, 400);
    }

    function attachNameListener(){
      var nameIntl = setInterval( function(){
        var firstname = $('#co-shipping-form .field[name="shippingAddress.firstname"] input[name="firstname"]');
        var lastname = $('#co-shipping-form .field[name="shippingAddress.lastname"] input[name="lastname"]');
        var name = firstname.add(lastname);

        if(firstname.length>0){
          firstname.closest('.field').append('<p id="remName" class="remChar">Remaining Characters: 35</p>');
          name.on('keypress', function(){
            var nameVal = firstname.val()+lastname.val();
            if(nameVal.length >= 35) return false;
            else updateFeedbackFactory('#remName', 35, nameVal.length)();
          }).on('keydown', function(){
            var nameVal = firstname.val()+lastname.val();
            updateFeedbackFactory('#remName', 35, nameVal.length)();
          }).on('keyup', function(){
            var nameVal = firstname.val()+lastname.val();
            updateFeedbackFactory('#remName', 35, nameVal.length)();
          });
          clearInterval(nameIntl);
        }
      }, 400);
    }

    function attachHouseNumberListener(){
      var houseIntl = setInterval( function(){
        var firstnumber = $('#co-shipping-form .field[name="shippingAddress.bss_custom_field[housenumber]"] input[name="bss_custom_field[housenumber]"]');
        var lastnumber = $('#co-shipping-form .field[name="shippingAddress.bss_custom_field[housenumbe_additional]"] input[name="bss_custom_field[housenumbe_additional]"]');
        var housenumber = firstnumber.add(lastnumber);

        if(firstnumber.length>0){
          firstnumber.closest('.field').append('<p id="remHouseNumber" class="remChar">Remaining Characters: 35</p>');
          housenumber.on('keypress', function(){
            var numberVal = firstnumber.val()+lastnumber.val();
            if(numberVal.length >= 8) return false;
            else updateFeedbackFactory('#remHouseNumber', 8, numberVal.length)();
          }).on('keydown', function(){
            var numberVal = firstnumber.val()+lastnumber.val();
            updateFeedbackFactory('#remHouseNumber', 8, numberVal.length)();
          }).on('keyup', function(){
            var numberVal = firstnumber.val()+lastnumber.val();
            updateFeedbackFactory('#remHouseNumber', 8, numberVal.length)();
          });

          clearInterval(houseIntl);
        }
      }, 400);
    }

    function attachPostCodeListener(){
      var regexPostCode = /^[\d]+[\da-zA-Z\s\-]*$/;
      var regexUKPostCode = /^[\da-zA-Z\s\-]*$/;
      var storeCode = 'nl';

      var postIntl = setInterval(function(){
        var postCode = $('#co-shipping-form .field[name="shippingAddress.postcode"] input[name="postcode"]');
        if(postCode.length > 0){
          postCode.on('keypress', function(e) {
            if (storeCode == 'en') {
                if (!regexUKPostCode.test(this.value + e.key))
                    return false;
            } else {
                if (!regexPostCode.test(this.value + e.key))
                    return false;
            }
          });
          clearInterval(postIntl);
        }
      }, 400);
    }

    $(document).ready(function(){

      var checkForm = setInterval(function() {
        var form = $('#co-shipping-form');
        if(form.length > 0){
          attachCompanyListener();
          attachExtraInfoListener();
          attachNameListener();
          attachHouseNumberListener();
          attachPostCodeListener();
          clearInterval(checkForm);
        }
      }, 500);

    });
  }
});
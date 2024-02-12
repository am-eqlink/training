
   function debounce(func, wait, immediate) {
      var timeout;
      return function() {
         var context = this, args = arguments;
         var later = function() {
         timeout = null;
         if (!immediate) func.apply(context, args);
         };
         var callNow = immediate && !timeout;
         clearTimeout(timeout);
         timeout = setTimeout(later, wait);
         if (callNow) func.apply(context, args);
      };
   };

    function image_resize(image, option) {
      return image + '/m/' + option;
    }

    function init() {
      var imgPreload = $('.preload .lazyload');

      imgPreload.each(function(){
        if ($(this).data('lazypreload')) {
          $(this).addClass('lazypreload');
        }
      });
    }

    window.onload = init;

   jQuery(document).ready(function () {

      $(window).on('load scroll resize', function() {
        var $productPrice = $('.product-details').find('.product-pricing');
        var scrollTop = $(window).scrollTop();
        var $checkoutContainer = $(document).find('#checkout-container');
      });

      if (pageData.personalization) {
        var personalizationEnabled = true;
      }

      var carouselArgs = {
        // options
        cellAlign: "left",
        contain: true,
        pageDots: false,
        adaptiveHeight: false,
        imagesLoaded: true,
        friction: 0.15,
        selectedAttraction: 0.01,
        dragThreshold: .5,
        watchCSS: true
      };

      var carouselProductArgs = carouselArgs;

      carouselProductArgs['pageDots'] = true;
      carouselProductArgs['prevNextButtons'] = false;
      carouselProductArgs['wrapAround'] = true;
      carouselProductArgs['watchCSS'] = false;

      $('.carousel-product').flickity(carouselProductArgs);
      $('.carousel-product').on('dragStart.flickity', () => (document.ontouchmove = () => false));
      $('.carousel-product').on('dragEnd.flickity', () => (document.ontouchmove = () => true));

      $('.carousel-product-nav').flickity({ 
        asNavFor: ".carousel-product", 
        contain: true, 
        pageDots: false,
        prevNextButtons: false,
        cellAlign: 'left'
      });

      $('.product-image-gallery-large').show();

      $("body").on("click", ".end-slide-previous", function () {
        $carousel.flickity("previous");
      });

      var $accordion = $('.accordion');
      var selectedQty = $('.quantity').val();

      $accordion.on('click', function(e) {
        $this = $(this);
        $target =  $this.next();

        var $allPanels = $this.parent().find('.panel');

        if(!$this.hasClass('active')){
          $accordion.removeClass('active');
          $allPanels.removeClass('open').slideUp();
          $this.addClass('active');
          $target.addClass('open').slideDown();
        } else {
          $target.removeClass('open').slideUp().delay(500);
          $this.removeClass('active');
        }
        
        e.preventDefault();
      });

      $('.qty-button').on('click', function() {

        var $button = $(this);
        var $qtyInput = $button.parent().find('.quantity');
        var oldQtyValue = $qtyInput.val();
        var newQtyValue = 1;

        if ($button.text() == "+") {
          newQtyValue = parseInt(oldQtyValue) + 1;
        } else {
          if (oldQtyValue > 1) {
            newQtyValue = parseInt(oldQtyValue) - 1;
          } else {
            newQtyValue = 1;
          }
        }

        $qtyInput.val(newQtyValue);
        selectedQty = newQtyValue; 

        if (personalizationEnabled) {
          updatePersonalizeStorage();
        }
        
      });

      $('.quantity').on('propertychange change blur', function(e) {
        var $input = $(this);
        var valueChanged = false;

        if (e.type=='propertychange') {
            valueChanged = e.originalEvent.propertyName=='value';
        } else {
            valueChanged = true;
        }
        if (valueChanged) {
          $input.val($input.val().replace(/[^0-9]/g, ''));
          $input.val($input.val().replace(/^(?:0+(?=[1-9])|0+(?=0$))/g, ''));
          if ($input.val() === '') {
            $input.val('1');
          }
          selectedQty = $input.val();
          if (personalizationEnabled) {
            updatePersonalizeStorage();
          }
        }
      });

      var $loadMoreBtn = $('.load-more-button');
      var loadPerPage = parseInt($loadMoreBtn.attr('data-review-per-page'));
      var loadTotal = parseInt($loadMoreBtn.attr('data-review-total'));
      if ($loadMoreBtn.find('.load-more-remaining')) {
        $loadMoreBtn.find('.load-more-remaining').text(loadTotal - loadPerPage);
      };

      $('.load-more').slice(0, loadPerPage).show();
      $('.load-more-button').on('click', function(e){
        var $loadMoreHidden = $('.load-more:hidden');
        e.preventDefault();
        if ($loadMoreBtn.find('.load-more-remaining')) {
          var rem = ($loadMoreHidden.length - loadPerPage);
          $loadMoreBtn.find('.load-more-remaining').text(rem);
        }
        $loadMoreHidden.slice(0, loadPerPage).slideDown();
        if($loadMoreHidden.length == loadPerPage || rem < 0) {
          $loadMoreBtn.parent().parent().remove();    
        }
      });

      var hideSpinningButtonIcon = function () {
        $(this).find('.cta-button-text').css({opacity: 1.0});
        $(this).find('.cta-button-icon').css({opacity: 0.0});
      };

      var showSpinningButtonIcon = function (btn) {
        $(this).find('.cta-button-text').css({opacity: 0.0});
        $(this).find('.cta-button-icon').css({opacity: 1.0});
      };

      $('.cta-button').on('click', function () {
        showSpinningButtonIcon.call(this);
        setTimeout(hideSpinningButtonIcon.bind(this), 7000);
        tracker.trackAddToCart();
      });

      if (typeof Apex != "undefined") {
        window.tracker = new Apex.tracker.Main(pageData.trackerConfig);
        tracker.trackViewContent();
      }

      var checkoutConfig = pageData.checkoutConfig;

      var offers = pageData.offers;

      var updateOffers = function (offers, productData = {}) {
        const properties = productData.properties;
        const additionalPrice = productData.additionalPrice;
        offers.forEach(function (offer) {
          offer.selected = Boolean(offer.selected);
          offer.line_items.forEach(function (lineItem) {
            let price = parseFloat(lineItem.price);
            lineItem.quantity = parseInt(lineItem.quantity);
            if (!lineItem.img_url.includes('/m/')) {
              lineItem.img_url = image_resize(lineItem.img_url.filename, '110x110');
            }
            if (Object.entries(additionalPrice).length > 0) {
              for (const addPrice in additionalPrice) {
                if (additionalPrice[addPrice] !== '' && additionalPrice[addPrice] > 0 && properties[addPrice] !== '') {
                  let totalAddPrice = parseFloat(additionalPrice[addPrice]);
                  price += totalAddPrice;
                }
              }
              lineItem.price = price;
              lineItem.display_price = '$' + price.toFixed(2) + ' ' + pageData.checkoutConfig.currency;
            }
            if (Object.entries(properties).length > 0) {
              lineItem.properties = properties;
            }
          });
        });
        return offers;
      };

      if (pageData.offers && pageData.offers.length > 0) {
        checkoutConfig['offers'] = updateOffers(offers);
      }

      if (typeof Apex != "undefined") {
        window.apex = new Apex.checkout.Main(checkoutConfig);
      } 

      var addPersonalizeData = function ($input, isLastInput = false) {
        const $inputValue = $input.val();
        const additionalPrice = $input.attr('data-additional-price') || 0;
        const $propertyName = $input.attr('name');
        const $allowMultipleAttr = $input.attr('allowmultiple');
        const allowMultiple = (typeof $allowMultipleAttr !== 'undefined' && $allowMultipleAttr !== false) ? true : false;
        let dataPrice = productData.additionalPrice;
        let dataProperties = productData.properties;
        let entries = $inputValue;
        let priceData = additionalPrice;
        if (additionalPrice && additionalPrice > 0) {
          if (productData.additionalPrice[$propertyName]) {
            priceData = dataPrice[$propertyName];
          }
        }
        if (dataProperties[$propertyName]) {
          if (selectedQty > 1 && allowMultiple) {
            entries = dataProperties[$propertyName] + ', ' + $inputValue;
            if (isLastInput) {
              let newEntries = entries.split(', ');
              newEntries.pop();
              if (newEntries.length > 1) { // only join if there are 2 or more elements 
                newEntries = newEntries.join(', ');
              }
              entries = newEntries + ', ' + $inputValue;
            }
          }
        }
        dataPrice[$propertyName] = priceData;
        dataProperties[$propertyName] = entries;
      };

      if (personalizationEnabled) {
        $('.personalization-field')
          .each( function(index, element) {
            addPersonalizeData($(element)); //adding the personalization field names in order of appearance
          })
          .on('blur', function() {
            const $input = $(this); 
            const $allowMultipleAttr = $input.attr('allowmultiple');
            const allowMultiple = (typeof $allowMultipleAttr !== 'undefined' && $allowMultipleAttr !== false) ? true : false;
            if (selectedQty == 1) { 
              $input.val() === '' ? updateInputStatus(0, $input) : updateInputStatus(1, $input);
              addPersonalizeData($input); //add data on blur if qty is 1
            }
          })
          .one('focus', function() {
            const $toolTip = $(this).parents('.field-group').find('.tooltip-text');
            if (selectedQty > 1) {
              $toolTip.removeAttr('hidden');
              setTimeout(function(){
                $toolTip.attr('hidden', true);
              }, 3000);
            }
          });
        
        $('.enter-text-tooltip').on('click', function() {
          const $toolTip = $(this).find('.tooltip-text');
          $toolTip.removeAttr('hidden');
          setTimeout(function(){
            $toolTip.attr('hidden', true);
          }, 3000);
        });
      }

      $('.input-text-field').on('keyup', function(event) { 
        const $input = $(this);
        const $personalizeStorage = $input.parent().siblings('.personalize-field-storage');
        const personalizeStorageCount = $personalizeStorage.children().length;
        let filledQty = parseInt($input.parents('.field-group').find('.filled-up').text());
        const properties = productData.properties;
        const propertyName = $input.attr('name');
        const $charLeft = $input.parents('.field-group').find('.char-left');
        const $maxIcon = $charLeft.parent().next();
        $input.parents('.input-group').removeClass('error');
        $charLeft.text($input.attr('maxlength') - $input.val().length);
        if (event.keyCode === 13 && (selectedQty > 1 && filledQty < selectedQty)) { // add input to storage after clicking/pushing enter
          if ($input.val() !== '') {
            event.preventDefault();
            $personalizeStorage.html('');
            $input.parents('.field-group').find('.duplicate-error').remove();
            addPersonalizeData($input); 
            filledQty += 1;
            updateInputStatus(filledQty, $input);
            const propArray = properties[propertyName].split(', '); 
            propArray.forEach((entry, index) => $personalizeStorage.append(addInputToStorage(entry, index)));
            $input.val('').focus();
            $charLeft.text($input.attr('maxlength'));
            if (selectedQty == propArray.length) {
              $input.attr('disabled', 'disabled');
              $input.parents('.input-group').addClass('disabled');
              $maxIcon.removeAttr('hidden');
              $charLeft.parent().hide();
            } else {
              $maxIcon.attr('hidden', true);
              $charLeft.parent().show();
            }
          } else {
            if ($input.attr('required') && !$input.attr('disabled')) {
              $input.parents('.input-group').addClass('error');
            }
          }
        }
      });

      $('.enter-personalize-data').on('click', function() {
        const $target = $(this);
        const $parentEl = $target.parents('.field-group');
        $parentEl.each(function (index, element) {
          const $inputFields = $(element).find('.personalization-field');
          let propArray = '';
          $inputFields.each(function (inputIndex, input) {
            const $input = $(input);
            const $personalizeStorage = $input.parents('.field-group').find('.personalize-field-storage');
            const propertyName = $input.attr('name');
            let filledQty = parseInt($input.parents('.field-group').find('.filled-up').text());
            if ($input.val() !== '') {
              addPersonalizeData($input);
              if (inputIndex === $inputFields.length - 1) { // update input status on last field on group
                filledQty += 1;
                updateInputStatus(filledQty, $input);
              }
              propArray = productData.properties[propertyName].split(', ');
              $personalizeStorage.html(''); 
              propArray.forEach((entry) => $personalizeStorage.append(addInputToStorage(entry, index)));
              if (selectedQty == propArray.length) {
                $input.attr('disabled', true);
                $input.parents('.input-group').addClass('disabled');
                $target.attr('disabled', true);
              }
            } else {
              if ($input.attr('required') && !$input.attr('disabled')) {
                $input.parent().addClass('error');
              }
            }
          });
        });
      });

      $('body').on('click', '.remove-personalized-input', function() {
        const $inputBtn = $(this);
        const $inputFields = $inputBtn.parents('.field-group').find('.personalization-field');
        const $inputValue = $inputBtn.find('.input-value').text();
        $inputFields.each(function(index, element) {
          const $mainInput = $(element);
          const $propertyName = $mainInput.attr('name');
          const $charLeftWrapper = $mainInput.parents('.field-group').find('.char-left-wrapper');
          const $maxIcon = $charLeftWrapper.next();
          const $enterButton = $mainInput.parent().find('.enter-personalize-data');
          let filledQty = parseInt($inputBtn.parents('.field-group').find('.filled-up').text());
          const $personalizeStorage = $mainInput.parent().siblings('.personalize-field-storage');
          const entries = productData.properties[$propertyName];
          let newEntries = entries
            .split(', ')
            .filter(entry => entry !== $inputValue)
            .join(', ');
          productData.properties[$propertyName] = newEntries;
          $personalizeStorage.html('');
          if (productData.properties[$propertyName] != '') {
            productData.properties[$propertyName]
              .split(', ')
              .forEach((entry, index) => $personalizeStorage.append(addInputToStorage(entry, index)));
          }
          $inputBtn.remove();
          filledQty -= 1;
          updateInputStatus(filledQty, $mainInput);
          if (filledQty == selectedQty) {
            $mainInput
              .attr('disabled', true)
              .parents('.input-group').addClass('disabled');
            $charLeftWrapper.hide();
            $maxIcon.removeAttr('hidden');
            $enterButton.attr('disabled', true);
          } else {
            $mainInput
              .removeAttr('disabled')
              .parent().removeClass('disabled');
            $charLeftWrapper.show();
            $maxIcon.attr('hidden', true);
            $enterButton.removeAttr('disabled'); 
          }
        });
      });

      var updatePersonalizeStorage = function () {
        $('.personalize-field-storage').each(function(index, element) {
          const $elParent = $(element).parents('.field-group');
          const $inputFields = $elParent.find('.personalization-field');
          // const $propertyName = $inputField.attr('name');
          const $charLeft = $elParent.find('.char-left-wrapper');
          const $maxIcon = $elParent.find('.max-icon');
          const $hiddenEl = $elParent.find('.hidden-element');
          const personalizeStorageCount = selectedQty > 1 ? $(element).children().length : 0;
          $inputFields.each(function (inputIndex, input) { // loop through each personalize field - makes it possible to have more fields on each field group
            const $inputField = $(input);
            const $propertyName = $inputField.attr('name');
            const $allowMultipleAttr = $inputField.attr('allowmultiple');
            const allowMultiple = (typeof $allowMultipleAttr !== 'undefined' && $allowMultipleAttr !== false) ? true : false;
            const properties = productData.properties[$propertyName];
            const $filledUp = $inputField.parents('.field-group').find('.filled-up');
            if (allowMultiple) {
              updateInputStatus(personalizeStorageCount, $inputField);
            } else {
              updateInputStatus(selectedQty, $inputField);
            }
            let filledQty = parseInt($filledUp.text());
            if (selectedQty > 1) {
              let propArray = properties.split(', ');
              if (propArray.length === 1 && allowMultiple) {
                productData.properties[$propertyName] = ''; // clear properties data when increasing qty from 1 and property has 1 data - to remove duplicates
              }
              $hiddenEl.removeAttr('hidden');
            } else {
              $hiddenEl.attr('hidden', true);
            }
            if (selectedQty < filledQty) {
              if (allowMultiple) removeLastFieldData($inputField);
              filledQty = selectedQty;
            }
            if (selectedQty > 1 && selectedQty == filledQty) {  
              if (allowMultiple) {
                $inputField
                  .attr('disabled', true)
                  .parents('.input-group').addClass('disabled');
                $charLeft.hide();
                $maxIcon.removeAttr('hidden');
                $inputField.prop('disabled', true);
              }
            } else {
              $inputField
                .removeAttr('disabled')
                .parents('.input-group').removeClass('disabled');
              $charLeft.show();
              $maxIcon.attr('hidden', true);
              $inputField.prop('disabled', false);
              if (selectedQty == 1) {  
                if ($inputField.val() !== '') {
                  updateInputStatus(1, $inputField);
                }
                $(element).html('');
              }
            }
          });
        });
      };
      
      var removeLastFieldData = function ($input) { // remove last data stored for quantity decrease
        const propertyName = $input.attr('name');
        const properties = productData.properties;
        const entries = properties[propertyName];
        const $personalizeStorage = $input.parent().siblings('.personalize-field-storage');
        const filledQty = parseInt($input.parents('.field-group').find('.filled-up').text());
        const $enterButton = $input.parents('.field-group').find('.enter-personalize-data');
        let newEntries = entries.split(', ');
        newEntries.pop();
        properties[propertyName] = newEntries.join(', ');
        $personalizeStorage.html('');
        $enterButton.removeAttr('disabled');
        if (selectedQty > 1) {
          newEntries.forEach((entry, index) => $personalizeStorage.append(addInputToStorage(entry, index)));
        } else {
          properties[propertyName] = '';
        }
        const personalizeStorageCount = $personalizeStorage.children().length;
        updateInputStatus(personalizeStorageCount, $input);
      } 

      var validatePersonalizeFields = function (productData) {
        let validated = {};
        $('.personalization-field').each(function(index, element) {
          const $field = $(element);
          const $fieldName = $field.attr('name');
          const filledQty = parseInt($field.parents('.field-group').find('.filled-up').text());
          const $allowMultipleAttr = $field.attr('allowmultiple');
          const allowMultiple = (typeof $allowMultipleAttr !== 'undefined' && $allowMultipleAttr !== false) ? true : false;
          validated[$fieldName] = true; // add true for all fields even if not required
          if (selectedQty == 1 || allowMultiple === false) {
            addPersonalizeData($field, true); // add data if qty is 1 - added when clicking buy now
          }
          if ($field.attr('required') && !$field.attr('disabled')) {
            if ($field.val() !== '') {
              $field.parents('.input-group').removeClass('error');
              validated[$fieldName] = true;
              if (filledQty < selectedQty) { // invalidate field if has input but filled quantity not reached the set quantity
                validated[$fieldName] = false; 
                $field.parents('.input-group').addClass('error');
              }
            } else {
              $field.parents('.input-group').addClass('error');
              validated[$fieldName] = false;
            }
          }
        });
        return Object.values(validated).every(Boolean); // return true if all true, else false
      }

      var updateInputStatus = function (filledQty, $input = null, grouped = false) {
        let $inputStatus = $('.input-status');
        if ($input) {
          $inputStatus = $input.parents('.field-group').find('.input-status');
        }
        const $allowMultipleAttr = $input.attr('allowmultiple');
        const allowMultiple = (typeof $allowMultipleAttr !== 'undefined' && $allowMultipleAttr !== false) ? true : false;
        if (selectedQty > 1 && allowMultiple) {
          $inputStatus.removeAttr('hidden');
        } else {
          $inputStatus.attr('hidden', true);
        }
        const $filledQty = $inputStatus.find('.filled-up');
        const $totalToFill = $inputStatus.find('.total-to-fillup');
        $totalToFill.text(selectedQty);
        if (filledQty >= 0 && filledQty <= selectedQty) {
          $filledQty.text(filledQty);
        }
      };

      var addPropertiesHTML = function (productData) {
        const $checkoutProductContent = $(document).find('#checkout .products .wrapper');
        const additionalPrice = productData.additionalPrice;
        const properties = productData.properties;
        let $propertyElement = '<div class="product-data" style="margin: 0 0 20px 80px;">';
        $propertyElement += '<div class="properties">';
        for (const property in properties) {
          const value = properties[property];
          if (value !== '') {
            $propertyElement += '<p><span class="property-name">' + property + ': </span><br>';
            $propertyElement += '<span class="property-value"><em>' + value + '</em></span></p>';
          }
        }
        $propertyElement += '</div></div>';
        $checkoutProductContent.append($propertyElement);
      } 

      var addInputToStorage = function (entry, index) {
        const currentIndex = parseInt(index + 1);
        let html = '<button class="btn remove-personalized-input" title="Remove">';
        html += '<span class="current-index">' + currentIndex + '</span>';
        html += '<span class="input-value ' + entry + '">' + entry + '</span>';
        html += '<svg width="18" height="20" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.44971" y="4.77686" width="0.464631" height="10.2219" transform="rotate(-45 3.44971 4.77686)" fill="white"/><rect x="10.6777" y="4.44824" width="0.464631" height="10.2219" transform="rotate(45 10.6777 4.44824)" fill="white"/></svg>';
        html += '</button>';
        return html;
      };

      var updateShippingCost = function (offer) {
        var lineItem = offer.line_items[0];
        if (lineItem.quantity * parseFloat(lineItem.price) > pageData.freeShippingThreshold) {
        apex.setShippingMethods([
          {
              handle: 'free-shipping',
              name: 'Free First Class Shipping',
              price: '0',
              selected: true
          },
          {
              handle: 'expedited-shipping',
              name: 'Expedited Shipping',
              price: '9.95',
              selected: false
          },
        ]);
        }
        else {
        apex.setShippingMethods(pageData.checkoutConfig.shippingMethods);
        }
      };

      var createDynamicOffer = function (variant, qty) {
         return {
         name: 'dynamic-offer',
         line_items: [
            {
               title: variant.displayName,
               variant_id: variant.variant_id,
               quantity: qty,
               price: variant.price,
               display_price: variant.displayPrice,
               img_url: image_resize(variant.img_url.filename, '110x110')
            }],
         selected: true
         }
      };
      
      var variants = pageData.variants;
      const defaultSuccessRedirect = pageData.successRedirect;

      var getVariant = function (options) {
        var variantName = options.filter(Boolean).join('-');
        var selected = variants[0]; // default to the first one;
        variants.forEach(function (variant) {
          if (variant.name === variantName) {
            selected = variant
          }
        });
        return selected;
      };

      var selectedVariantOptions = pageData.defaultVariantOptions.split(',');
      var selectedVariant = getVariant(selectedVariantOptions);

      pageData.successRedirect = selectedVariant.success_redirect || defaultSuccessRedirect;

      var updatePricing = function (selectedVariant) {
        $('.product-pricing-original').html(selectedVariant.originalPrice);
        $('.product-pricing-sale').html(selectedVariant.displayPrice);
        $('.product-pricing-save').html(selectedVariant.savePercentage);
      };

      var onCarouselMainChange = function (event, index) {
        $('.carousel-nav .product-image-small').removeClass('active');
        $('.carousel-nav .product-image-small').eq(index).addClass('active');
      };

      $('.carousel-product').on('change.flickity', onCarouselMainChange);

      $('.product-variant').on('click', function () {
        var variantOptionIndex = $(this).parents('.product-variants').index('.product-variants') + 1;
        $(this).siblings('.product-variant').removeClass('active');
        $(this).addClass('active');
        var selectedVariantName = $(this).data('variant-name');
        selectedVariantOptions[variantOptionIndex] = selectedVariantName;
        selectedVariant = getVariant(selectedVariantOptions);
        updatePricing(selectedVariant);
        
        pageData.successRedirect = selectedVariant.success_redirect || defaultSuccessRedirect;

        $('.carousel-product').flickity('select', selectedVariant.picIndex);
        
      });

      $('.cta-button').on('click', debounce(function () {
        var offer;
        var validated = validatePersonalizeFields(productData);
        var startCheckout = true;
        if (!pageData.offers) {
          offer = createDynamicOffer(selectedVariant, selectedQty);
          updateShippingCost(offer);
          apex.setOffers([offer]);
          apex.selectOffer(offer.name);
        } else {
          apex.selectOffer(selectedVariant.offer_name);
        }
        if (personalizationEnabled && validated) {
          updateOffers([offer], productData);
          startCheckout = true;
        } else {
          startCheckout = false;
        }
        if (startCheckout) {
          apex.checkoutView.startCheckout();
        }
      }, 500, true));

      apex.on('startedCheckout', function (data) {
        tracker.trackInitiateCheckout(data);
        addPropertiesHTML(productData);
      });

      apex.on('addedShippingInfo', function (data) {
         tracker.trackAddShippingInfo();
      });

      apex.on('addedPaymentInfo', function (data) {
         tracker.trackAddPaymentInfo(data);
      });

      apex.on('initialOrderCompleted', function (res) {
         tracker.trackInitialPurchase(res.id, res.data.total_price, res.data.currency, null, null, res.data.line_items);
         tracker.setCookie('cartId', res.id);
         setTimeout(function () {
         window.location.replace(pageData.successRedirect + '?cartId=' + res.id);
         }, 0);
      });
    });
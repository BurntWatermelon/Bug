
// This is literally the checkout, it creates a draft order then inject window href with custom data url to go to invoice.... one thing is, how do we deal with all these
//draft orders?
function checkoutHandler(){

    // Gets users actual cart...
    $.getJSON('/cart.js', function(cart) {
        window.offerme.cart = cart;
        $.ajax({
            type: "POST",
            url: "http://634d98f12700.ngrok.io",
            data: {cart_json: window.offerme,store_id: window.offerme.store_id,cart_collections: JSON.stringify(window.offerme.cart_collections)},
            crossDomain: true,
            // This is recursive its rehitting
            success: function(res) {
                console.log("IN RES")
                console.log(res)

                if(typeof res == "string"){
                    window.location.href = res // this is setting the custom URL!
                }else{
                    window.location.href = "/checkout" // this is fallback without discount..
                }

                // To update cart we will take res and hit /cart/change.js ... but we want to actually show the discount with cross out the way hulk does it
                //hmm actually it doesnt look like we can do that, I think we need to remove the item and call add.js for the new price
                // I actually dont think hulk is updating, its showing their price and maybe calling the update on actual checkout ?
                // hmmm it looks like it maybe imported from hulk? December 16, 2020 at 3:23 a.m. from Volume & Tiered Discounts (via import)
                // ahhhhh they use draft orders.. as an api.. but how does the payment still get handled on storefront? And uses the discounted amount..?
                // https://shopify.dev/docs/admin-api/rest/reference/orders/draftorder yeah looks like this is how you actually get discounts on order, the rest is all UI magic
                // but how do we inject draft order for the actual order as user pays..? Could be an order webhook and app pulls invoice and sets fulfilled but like.. how are we paying discount?
                // maybe theres a /checkout resource with a custom draft order ID so user's paying with that...
                // oh i see its a redirect from hulk apps sending the page to the checkout of the draft order https://urgonomic.myshopify.com/28055666777/checkouts/38b7f5a2f1af86716a89c4efb17a8328
                // https://shopify.dev/docs/admin-api/rest/reference/sales-channels/checkout -- then I think we redirect to hit them with this URL we generate for the draft order.

            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(errorThrown)
                window.location.href = "/checkout" // this is fallback without discount..
            }
        });
    });
}


// HULK CODE IS ABLE TO SHOW DISCOUNT ON CART>.. FIGURE THAT OUT TOO
function pricingHandler(){
   // Ok in hulkcode do action, they call get_cart_details on cart page the data response then modifies some css elements to show discount


    // We do pricing, wait for response, then modify UI ... but this should all be done before rendering?? or modify dom on fly
    $.ajax({
        type: "POST",
        url: window.offerme.url + "/pricing",
        data: {cart_json: window.offerme,store_id: window.offerme.store_id,cart_collections: JSON.stringify(window.offerme.cart_collections)},
        crossDomain: true,
        success: function(data){
            console.log("RES Pricing")

            console.log(data)

            showCartDiscounts(data)


            $(checkout_selectors).attr('disabled', false);
          // hulkappsDoActions(data)
        },
        error: function (request, error) {
            $(checkout_selectors).attr('disabled', false);
        }
    });


}
function showCartDiscounts(data){

    // My res
    // {
    //     "cart": {
    //     "items": [
    //         {
    //             "productId": "5252035051685",
    //             "price": "4000"
    //         }
    //     ]
    // },
    //     "customerId": "WHERE IS INJECTED SCRIPT SENDING??",
    //     "clientId": "offliction.myshopify.com",
    //     "discounts": {
    //     "items": [
    //         {
    //             "productId": "5252035051685",
    //             "price": "4000",
    //             "discountedPrice": 2000
    //         }
    //     ]
    // }
    // }

    /* HULKS RES of get_cart_details
    {
  "discounts": {
    "cart": {
      "items": [
        {
          "key": "31862929293401:4b1b88b03bebd8104d5f8be1034458a1",
          "quantity": "4",
          "variant_id": "31862929293401",
          "discounted_price": 622,
          "line_price": 2688,
          "properties": null,
          "original_price": 672,
          "original_line_price": 2688,
          "cart_discount_away_msg": "",
          "original_price_format": "$672.00",
          "original_line_price_format": "$2,688.00",
          "discounted_price_format": "$622.00",
          "discounted_line_price_format": "$2,488.00"
        }
      ]
    },
    "original_price_total": "$2,688.00",
    "discounted_price_total": "$2,488.00",
    "discount_show": false,
    "discount_code": "",
    "with_discount": "$0.00",
    "cart_discount_away_msg_html": "",
    "cart_discount_away_msg": "",
    "final_with_discounted_price": null,
    "discount_error": null,
    "is_free_shipping": "",
    "plan": null,
    "cart_discount_msg_html": "",
    "cart_discount_msg": null,
    "cart_discount_reminder_msg_html": "",
    "cart_discount_reminder_msg": "",
    "is_draft_order": true
  }
}
     */


   // window.offerme.discounts = discounts;
    discounts = data
    var flag=0;
    data.discount.items.forEach(function(item) {

        console.log(item)



        if (item.cart_discount_away_msg_html){
            $(".hulkapps-reminder[data-key='" + item.key + "']").html(item.cart_discount_away_msg_html);
        }else{
            $(".hulkapps-reminder[data-key='" + item.key + "']").html('');
        }
        if (item.discountedPrice < item.price) {
            flag=1;
            $(".hulkapps-cart-item-price[data-key='" + item.key + "']").html("<span class='original_price' style='text-decoration:line-through;'>" + item.original_price_format + "</span><br/>" + "<span class='discounted_price'>" + item.discounted_price_format + "</span>");
            $(".hulkapps-cart-item-line-price[data-key='" + item.key + "']").html("<span class='original_price' style='text-decoration:line-through;'>" + item.original_line_price_format + "</span><br/>" + "<span class='discounted_price'>" + item.discounted_line_price_format + "</span>")
        }else{
            $(".hulkapps-cart-item-price[data-key='" + item.key + "']").html("<span class='original_price'>" + item.original_price_format + "</span>");
            $(".hulkapps-cart-item-line-price[data-key='" + item.key + "']").html("<span class='original_price'>" + item.original_line_price_format + "</span>")
        }
    });
    $(".hulkapps-discount-bar").html('');
    $(".hulkapps-cart-total,.hulkapps-discount-reminder-msg").remove();
    $(".hulkapps-cart-original-total").css("text-decoration", "none");
    if(flag==1 || discounts.cart_discount_msg_html || discounts.is_draft_order){
        if(discounts.final_with_discounted_price == null && discounts.discounted_price_total != discounts.original_price_total){
            $(".hulkapps-cart-original-total").html(discounts.original_price_total).css("text-decoration", "line-through");
            $("<span class='hulkapps-cart-total'>" + discounts.discounted_price_total + "</span>").insertAfter('.hulkapps-cart-original-total');
        }else if(discounts.final_with_discounted_price != null){
            $(".hulkapps-cart-original-total").html(discounts.original_price_total).css("text-decoration", "line-through");
            $("<span class='hulkapps-cart-total'>" + discounts.final_with_discounted_price + "</span>").insertAfter('.hulkapps-cart-original-total');
        }
        if($(".hulkapps-discount-bar").length > 0){
            $(".hulkapps-discount-bar").html(discounts.cart_discount_msg_html)
        }else{
            $('form[action="/cart"]').prepend(discounts.cart_discount_msg_html)
        }
    }
    if(discounts.cart_discount_reminder_msg_html){
        if($(".hulkapps-cart-reminder").length > 0){
            $(".hulkapps-cart-reminder").html(discounts.cart_discount_reminder_msg_html)
        }else if($(".alert.hulkapps-discount-bar-msg").length > 0){
            $('.alert.hulkapps-discount-bar-msg').after(discounts.cart_discount_reminder_msg_html)
        }else{
            $('form[action="/cart"]').prepend(discounts.cart_discount_reminder_msg_html)
        }
    }
    $('.hulkapps_summary').remove();
    if (discounts.discount_code && discounts.discount_error == 1){
        $(".hulkapps-cart-original-total").html(discounts.original_price_total);
        $(".hulkapps_discount_hide").after("<span class='hulkapps_summary'>Discount code does not match</span>");
        localStorage.removeItem('discount_code');
    }else if (discounts.is_free_shipping){
        $(".hulkapps_discount_hide").after("<span class='hulkapps-summary-line-discount-code'><span class='discount-tag'>"+ discounts.discount_code +"<span class='close-tag'></span></span>Free Shipping");
    }else if(discounts.discount_code && $('.discount_code_box').is(":visible")){
        $(".hulkapps_discount_hide").after("<span class='hulkapps-summary-line-discount-code'><span class='discount-tag'>"+ discounts.discount_code +"<span class='close-tag'></span></span><span class='hulkapps_with_discount'>"+" -" + discounts.with_discount + "</span></span><span class='after_discount_price'><span class='final-total'>Total</span>"+discounts.final_with_discounted_price +"</span>");
        if(flag ==1 || discounts.cart_discount_msg_html){
            $(".hulkapps-cart-original-total").html(discounts.discounted_price_total).css("text-decoration", "line-through");
        }else{
            $(".hulkapps-cart-original-total").html(discounts.original_price_total).css("text-decoration", "line-through");
        }
        $(".hulkapps-cart-total").remove();
    }else{
        $(".hulkapps-cart-original-total").html(discounts.original_price_total);
    }


}

function registerListeners(){

    // Do pricing call......................
    pricingHandler();



    var checkout_selectors = "input[name='checkout']:not(.hulkapps-ignore), input[value='Checkout']:not(.hulkapps-ignore), button[name='checkout']:not(.hulkapps-ignore), [href$='checkout']:not(.hulkapps-ignore), button[value='Checkout']:not(.hulkapps-ignore), input[name='goto_pp'], button[name='goto_pp'], input[name='goto_gc'], button[name='goto_gc'],.hulkapps_checkout"

    $(document).on('click', checkout_selectors, function(e){
        e.preventDefault();
        if (typeof checkoutHandler != "function") {
            window.location = "/checkout";
        }
        // Order Delivery Date App Code for validation issue
        if(typeof hulkappsCheckoutClick === 'undefined'){
            $(this).attr('disabled','disabled');
            checkoutHandler();
        }else{
            var result = hulkappsCheckoutClick();
            if(result == true){
                $(this).attr('disabled','disabled');
                checkoutHandler();
            }
        }
    })
}

registerListeners();
//checkoutHandler()

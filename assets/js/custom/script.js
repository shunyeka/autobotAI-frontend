// Page Loader
$(window).ready(function () {
  "use strict";
  Utilities.hideLoader();
});



// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function () {

  "use strict";

  $('a.page-scroll').bind('click', function (event) {
    var $anchor = $(this);
    var url = $anchor.attr('href')
    var hash = url.substring(url.indexOf("#"));
    $('html, body').stop().animate({
      scrollTop: $(hash).offset().top - 68
    }, 1500, 'easeInOutExpo');
    event.preventDefault();
  });
});


// Highlight the top nav as scrolling occurs
$('body').scrollspy({
  target: '.fixed-top',
  offset: 70
});

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function () {
  "use strict";
  $('.navbar-toggle:visible').click();
});

$(document).ready(function(){
  $('.owl-carousel').owlCarousel({
    loop: true,
    margin: 10,
    nav: true,
    autoplay: true,
    responsive: {
      0: {
        items: 1
      },
      600: {
        items: 3
      },
      1000: {
        items: 5
      }
    }
  });
  $('.owl-nav').hide();
  $('.owl-dots').hide();
});

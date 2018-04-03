$(document).ready(function ($) {
    'use strict';


});

/* ---------------------------------------------
 owl caroussel
 --------------------------------------------- */

$('.screenshot_slider').owlCarousel({
    loop: true,
    responsiveClass: true,
    nav: true,
    margin: 5,
    autoplay: true,
    autoplayTimeout: 4000,
    smartSpeed: 500,
    center: true,
    navText: ['<span class="icon-arrow-left"></span>', '<span class="icon-arrow-right"></span>'],
    responsive: {
        0: {
            items: 1,
        },
        600: {
            items: 3
        },
        1200: {
            items: 5
        }
    }
});


$('.testimonial-caroussel').owlCarousel({
    loop: true,
    responsiveClass: true,
    nav: true,
    autoplay: true,
    autoplayTimeout: 4000,
    smartSpeed: 500,
    center: true,
    navText: ['<span class="icon-arrow-left"></span>', '<span class="icon-arrow-right"></span>'],
    responsive: {
        0: {
            items: 1,
        },
        600: {
            items: 1

        },
        1200: {
            items: 1
        }
    }
});


/*--------------------
 MAGNIFIC POPUP JS
 ----------------------*/
$('.popup-image').magnificPopup({
    type: 'image',
    removalDelay: 300,
    mainClass: 'mfp-with-zoom',
    gallery: {
        enabled: true
    },
    zoom: {
        enabled: true,

        duration: 300,
        easing: 'ease-in-out',

        opener: function (openerElement) {

            return openerElement.is('img') ? openerElement : openerElement.find('img');
        }
    }
});

/* ---------------------------------------------
 Back top page scroll up
 --------------------------------------------- */


/* ---------------------------------------------
 WoW plugin
 --------------------------------------------- */

new WOW().init({
    mobile: true,
});

/* ---------------------------------------------
 Smooth scroll
 --------------------------------------------- */

/*----------------------------------------
 Newsletter Subscribe
 --------------------------------------*/
 

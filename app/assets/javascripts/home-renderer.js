
const $ = require('jquery');
import Vue from 'vue';

import Typed from 'typed.js';
import Slick from 'slick-carousel';

//require('owl.carousel')

import DashboardRenderer from './dashboard-renderer'

var dashboardRenderer = new DashboardRenderer();


export default class HomeRenderer {

    init( ethHelper )
    {




     setInterval( function(){


         ethHelper.connectToContract( web3 , dashboardRenderer, function(contractData){

           dashboardRenderer.update(contractData);

         } );

      },30 * 1000);




        ethHelper.connectToContract( web3 , dashboardRenderer, function(contractData){

          dashboardRenderer.init(contractData);

        } );








  /*
      $('.testimonial-carousel').slick({
        dots: true,
        speed: 500
      });




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



      $.scrollUp({
          scrollText: '<i class="icon-arrow-up"></i>',
          easingType: 'linear',
          scrollSpeed: 900,
          animation: 'fade'
      });


      new WOW().init({
          mobile: true,
      });

        $('a.section-scroll[href*="#"]:not([href="#"])').on('click', function (event) {
          if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '')
              || location.hostname == this.hostname) {

              var target = $(this.hash);
              target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
              if (target.length) {
                  // Only prevent default if animation is actually gonna happen
              event.preventDefault();
                  $('html,body').animate({
                      scrollTop: target.offset().top
                  }, 750);
                  return false;
              }
          }
      });
      */


      console.log('init home')

    }

     update( )
    {

    }

    hide()
    {

    }

    show()
    {

    }

}

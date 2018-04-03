const $ = require('jquery');


export default class Navbar {


      init( )
      {


        // Get all "navbar-burger" elements
        var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

        console.log($navbarBurgers.length)
        // Check if there are any navbar burgers
        if ($navbarBurgers.length > 0) {

          // Add a click event on each of them
          $navbarBurgers.forEach(function ($el) {
            $el.addEventListener('click', function () {

              // Get the target from the "data-target" attribute
              var target = $el.dataset.target;
              var $target = document.getElementById(target);

              // Toggle the class on both the "navbar-burger" and the "navbar-menu"
              $el.classList.toggle('is-active');
              $target.classList.toggle('is-active');

            });
          });
        }



        var $fadedin = $('.faded-in') ;
            console.log('meep');

          if ($fadedin.length > 0) {
            $.each($fadedin,function () {
              var fadeTime = $(this).data('fade-time');
              console.log($(this));
              console.log(fadeTime);
             $(this).delay(fadeTime).animate({ opacity: 1 }, 400)
            });

          }


          var $activeDropdown = $('.dropdown-button') ;

          if ($activeDropdown.length > 0) {
            $.each($activeDropdown,function () {
              $(this).on('click',function (){
                  var parent = $(this).parent();
                  var dropdownContent = $(parent).find('.navbar-dropdown').first();

                  var visible = $(dropdownContent).css('display') == 'block';

                    $('.navbar-dropdown').css('display','none');

                  if(!visible)
                  {
                      $(dropdownContent).css('display','block');
                      $(dropdownContent).hide();
                      $(dropdownContent).fadeIn(100);
                  }

              });


            });

          }


      }
}

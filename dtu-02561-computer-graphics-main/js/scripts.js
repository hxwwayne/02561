/*!
    * Start Bootstrap - Resume v6.0.2 (https://startbootstrap.com/theme/resume)
    * Copyright 2013-2020 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
    */
    (function ($) {
    "use strict"; // Start of use strict


    <!-- Worksheet 1 -->
    $(document).ready(function(){
       $('#iframe').attr('src', 'js/worksheet1/part1/part1.html');
    });

    $(document).ready(function(){
       $('#iframe2').attr('src', 'js/worksheet1/part2/part2.html');
    });

    $(document).ready(function(){
       $('#iframe3').attr('src', 'js/worksheet1/part3/part3.html');
    });

    $(document).ready(function(){
       $('#iframe4').attr('src', 'js/worksheet1/part4/part4.html');
    });

    $(document).ready(function(){
       $('#iframe5').attr('src', 'js/worksheet1/part5/part5.html');
    });

    <!-- Worksheet 2 -->
    $(document).ready(function(){
       $('#iframe6').attr('src', 'js/worksheet2/part1/part1.html');
    });

    $(document).ready(function(){
       $('#iframe7').attr('src', 'js/worksheet2/part2/part2.html');
    });

    $(document).ready(function(){
       $('#iframe8').attr('src', 'js/worksheet2/part3/part3.html');
    });

    $(document).ready(function(){
       $('#iframe9').attr('src', 'js/worksheet2/part4/part4.html');
    });

    <!-- Worksheet 3 -->
    $(document).ready(function(){
       $('#iframe10').attr('src', 'js/worksheet3/part1/part1.html');
    });

    $(document).ready(function(){
       $('#iframe11').attr('src', 'js/worksheet3/part2/part2.html');
    });

    <!-- Worksheet 4 -->
    $(document).ready(function(){
       $('#iframe12').attr('src', 'js/worksheet4/part1/part1.html');
    });
    $(document).ready(function(){
       $('#iframe13').attr('src', 'js/worksheet4/part2/part2.html');
    });
    $(document).ready(function(){
       $('#iframe14').attr('src', 'js/worksheet4/part3/part3.html');
    });
    $(document).ready(function(){
       $('#iframe15').attr('src', 'js/worksheet4/part4/part4.html');
    });
    $(document).ready(function(){
       $('#iframe16').attr('src', 'js/worksheet4/part5/part5.html');
    });
    $(document).ready(function(){
       $('#iframe17').attr('src', 'js/worksheet4/part6/part6.html');
    });

    <!-- Worksheet 5 -->
    $(document).ready(function(){
       $('#iframe18').attr('src', 'js/worksheet5/part3/part3.html');
    });


    <!-- Project -->
    $(document).ready(function(){
       $('#iframe_project').attr('src', 'js/project/project.html');
    });




    $(document).ready(function(){

       $('#content').load("https://www.wiiworker.com");

    });

    // Smooth scrolling using jQuery easing
    $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function () {
        if (
            location.pathname.replace(/^\//, "") ==
                this.pathname.replace(/^\//, "") &&
            location.hostname == this.hostname
        ) {
            var target = $(this.hash);
            target = target.length
                ? target
                : $("[name=" + this.hash.slice(1) + "]");
            if (target.length) {
                $("html, body").animate(
                    {
                        scrollTop: target.offset().top,
                    },
                    1000,
                    "easeInOutExpo"
                );
                return false;
            }
        }
    });

    // Closes responsive menu when a scroll trigger link is clicked
    $(".js-scroll-trigger").click(function () {
        $(".navbar-collapse").collapse("hide");
    });

    // Activate scrollspy to add active class to navbar items on scroll
    $("body").scrollspy({
        target: "#sideNav",
    });
})(jQuery); // End of use strict

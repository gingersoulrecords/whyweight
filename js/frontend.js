/**
 * WhyWeight Frontend JS
 */

(function ($) {
    'use strict';

    // Log when the script runs
    console.log('WhyWeight plugin script loaded');

    /**
     * Initialize Swiper on elements with class 'why-weight-slider'
     */
    function initSwipers() {
        console.log('WhyWeight: Initializing Swiper instances');

        // Find all elements with the 'why-weight-slider' class
        const sliderContainers = document.querySelectorAll('.why-weight-slider');

        if (sliderContainers.length === 0) {
            console.log('WhyWeight: No slider containers found');
            return;
        }

        console.log(`WhyWeight: Found ${sliderContainers.length} slider containers`);

        // Initialize each slider
        sliderContainers.forEach(function (container, index) {
            console.log(`WhyWeight: Initializing slider #${index + 1}`);

            const slider = new Swiper(container, {
                slidesPerView: 1,
                spaceBetween: 30,
                loop: true,

                // Navigation arrows
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },

                // Pagination
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                }
            });

            console.log(`WhyWeight: Slider #${index + 1} initialized`);
        });
    }

    // Document ready
    $(function () {
        console.log('WhyWeight: DOM ready');

        // Test if Swiper exists
        if (typeof Swiper === 'function') {
            console.log('WhyWeight: Swiper is loaded successfully');

            // Initialize sliders
            initSwipers();
        } else {
            console.error('WhyWeight: Swiper is not loaded');
        }
    });

})(jQuery);

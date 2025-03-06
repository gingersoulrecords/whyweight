/**
 * WhyWeight Frontend JS
 */

(function ($) {
    'use strict';

    // Create global WhyWeight object
    window.whyWeight = {
        // Will hold the Swiper instance
        swiper: null,

        // Object to store assessment answers
        answers: {},

        // Initialize everything
        init: function () {
            console.log('WhyWeight: Initializing');
            this.initSwiper();
            this.bindNavButtons();
            this.bindBMICalculator();
            this.bindActivitySelect();
        },

        // Initialize the single Swiper instance
        initSwiper: function () {
            const sliderContainer = $('.ww-slider');

            if (sliderContainer.length === 0) {
                console.log('WhyWeight: No slider container found');
                return;
            }

            console.log('WhyWeight: Found slider container');

            // Initialize Swiper
            this.swiper = new Swiper(sliderContainer[0], {
                slidesPerView: 1,
                spaceBetween: 30,
                loop: false,

                // Add fade effect
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },

                // Progress bar pagination
                pagination: {
                    el: '.swiper-pagination',
                    type: 'progressbar'
                }
            });

            console.log('WhyWeight: Swiper initialized');
        },

        // Bind click handlers to navigation buttons
        bindNavButtons: function () {
            // Bind previous button/link clicks
            $('.ww-prev-link').on('click', function (e) {
                e.preventDefault();
                if (window.whyWeight.swiper) {
                    window.whyWeight.swiper.slidePrev();
                    console.log('WhyWeight: Navigated to previous slide');
                }
            });

            // Bind next button clicks
            $('.ww-next-button').on('click', function (e) {
                e.preventDefault();
                if (window.whyWeight.swiper) {
                    window.whyWeight.swiper.slideNext();
                    console.log('WhyWeight: Navigated to next slide');
                }
            });

            console.log('WhyWeight: Navigation buttons bound');
        },

        // Bind BMI calculator functionality
        bindBMICalculator: function () {
            const heightFeetInput = $('#height-feet');
            const heightInchesInput = $('#height-inches');
            const weightInput = $('#weight-lbs');
            const bmiResult = $('#bmi-result');

            const calculateBMI = function () {
                const feet = parseFloat(heightFeetInput.val()) || 0;
                const inches = parseFloat(heightInchesInput.val()) || 0;
                const weight = parseFloat(weightInput.val()) || 0;

                // Calculate total height in inches
                const totalInches = (feet * 12) + inches;

                if (totalInches > 0 && weight > 0) {
                    // BMI formula: (weight in pounds * 703) / (height in inches)²
                    const bmi = ((weight * 703) / (totalInches * totalInches)).toFixed(1);
                    bmiResult.val(bmi);

                    // Save BMI to answers
                    window.whyWeight.saveAnswer('bmi', bmi);
                } else {
                    bmiResult.val('');
                }
            };

            // Bind input events
            heightFeetInput.on('input', calculateBMI);
            heightInchesInput.on('input', calculateBMI);
            weightInput.on('input', calculateBMI);

            // Save individual measurements when they change
            heightFeetInput.on('change', function () {
                window.whyWeight.saveAnswer('height-feet', $(this).val());
            });

            heightInchesInput.on('change', function () {
                window.whyWeight.saveAnswer('height-inches', $(this).val());
            });

            weightInput.on('change', function () {
                window.whyWeight.saveAnswer('weight-lbs', $(this).val());
            });
        },

        // Bind activity select functionality
        bindActivitySelect: function () {
            $('#activity').on('change', function () {
                window.whyWeight.saveAnswer('activity', $(this).val());
            });
        },

        // Save an answer to the answers object
        saveAnswer: function (questionId, answer) {
            this.answers[questionId] = answer;
            console.log('WhyWeight: Saved answer', questionId, answer);
            console.log('WhyWeight: Current answers:', this.answers);
        },

        // Go to a specific slide
        goToSlide: function (index) {
            if (this.swiper) {
                this.swiper.slideTo(index);
                console.log('WhyWeight: Navigated to slide', index);
            }
        }
    };

    // Document ready
    $(function () {
        console.log('WhyWeight: DOM ready');

        // Test if Swiper exists
        if (typeof Swiper === 'function') {
            console.log('WhyWeight: Swiper is loaded successfully');

            // Initialize WhyWeight
            window.whyWeight.init();
        } else {
            console.error('WhyWeight: Swiper is not loaded');
        }
    });

})(jQuery);

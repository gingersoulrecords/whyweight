/**
 * WhyWeight Frontend JS - With Answer Data Attributes for Styling
 */

(function ($) {
    'use strict';

    // Create global WhyWeight object
    window.whyWeight = {
        // Will hold the Swiper instance
        swiper: null,

        // Object to store assessment answers
        answers: {},

        // Slide name to index mapping
        slideMap: {},

        // Initialize everything
        init: function () {
            console.log('WhyWeight: Initializing');
            this.initSlideMap();
            this.initSwiper();
            this.bindGlobalHandlers();
            this.bindBMICalculator();
            this.bindRadioButtons();
            this.bindSummaryGeneration();
        },

        // Create a mapping of slide names to slide indices
        initSlideMap: function () {
            $('.swiper-slide').each(function (index) {
                const slideName = $(this).data('slide-name');
                if (slideName) {
                    window.whyWeight.slideMap[slideName] = index;
                    console.log(`WhyWeight: Mapped slide "${slideName}" to index ${index}`);
                }
            });
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
                autoHeight: true,
                slidesPerView: 1,
                spaceBetween: 30,
                loop: false,
                allowTouchMove: false,

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

            // Add slide change event handler after Swiper is initialized
            const self = this;
            this.swiper.on('slideChange', function () {
                const activeIndex = self.swiper.activeIndex;
                const slideName = $('.swiper-slide').eq(activeIndex).data('slide-name');

                if (slideName === 'results') {
                    self.generateSummary();
                }

                // When navigating to contact slide, populate the textarea
                if (slideName === 'contact') {
                    self.populateTextarea();
                }
            });

            console.log('WhyWeight: Swiper initialized');
        },

        // Bind global handlers using event delegation
        bindGlobalHandlers: function () {
            const self = this;

            // Handle choice buttons that store answers (delegated event)
            $(document).on('click', '.ww-choice-btn', function () {
                const $this = $(this);
                const questionId = $this.data('question-id');
                const answer = $this.data('value');
                const autoNavigate = $this.data('auto-navigate') !== undefined;

                // If this button is part of a group, handle group styling
                const $group = $this.closest('.ww-button-group, .ww-radio-group');
                if ($group.length) {
                    $group.find('.ww-choice-btn, .ww-radio').removeClass('active');
                    $this.addClass('active');
                }

                // Save the answer if we have a question ID
                if (questionId) {
                    self.saveAnswer(questionId, answer);
                }

                // If button has a navigate attribute, go to that slide
                const navigateTo = $this.data('navigate');
                if (navigateTo) {
                    self.navigateByName(navigateTo);
                } else if (autoNavigate) {
                    // Auto-navigate to next slide if auto-navigate is enabled
                    self.swiper.slideNext();
                }
            });

            // Handle navigation buttons (delegated event)
            $(document).on('click', '[data-navigate]', function (e) {
                e.preventDefault();
                const navigateAction = $(this).data('navigate');

                switch (navigateAction) {
                    case 'next':
                        self.swiper.slideNext();
                        break;
                    case 'prev':
                        self.swiper.slidePrev();
                        break;
                    case 'intro':
                        // Special case for "Start Over" button
                        self.resetAssessment();
                        break;
                    default:
                        // Assume it's a slide name
                        self.navigateByName(navigateAction);
                }

                console.log(`WhyWeight: Navigated ${navigateAction}`);
            });

            console.log('WhyWeight: Global handlers bound');
        },

        // Bind radio button functionality for auto-navigation
        bindRadioButtons: function () {
            const self = this;

            // Remove any existing event handlers to prevent duplicates
            $(document).off('click', '.ww-radio');

            // Use click handler instead of change event - this works regardless of previous state
            $(document).on('click', '.ww-radio', function (e) {
                const $radio = $(this);
                const $input = $radio.find('input[type="radio"]');
                const $span = $radio.find('.ww-radio-text');

                // Check/select the radio input
                $input.prop('checked', true);

                // Update active state for styling
                $radio.closest('.ww-radio-group').find('.ww-radio').removeClass('active');
                $radio.addClass('active');

                // Get data from the span
                const questionId = $span.data('question-id');
                const answer = $span.data('value');
                const navigateTo = $span.data('navigate');

                console.log('Radio clicked:', {
                    questionId,
                    answer,
                    navigateTo
                });

                // Save the answer
                if (questionId) {
                    self.saveAnswer(questionId, answer);
                }

                // Always handle navigation based on data-navigate
                if (navigateTo) {
                    console.log('Navigating to:', navigateTo);
                    if (navigateTo === 'next') {
                        self.swiper.slideNext();
                    } else {
                        self.navigateByName(navigateTo);
                    }
                }
            });
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

                    // Also add a calculated BMI range
                    const bmiValue = parseFloat(bmi);
                    let bmiRange = '';

                    if (bmiValue < 18.5) {
                        bmiRange = 'underweight';
                    } else if (bmiValue >= 18.5 && bmiValue < 25) {
                        bmiRange = 'normal';
                    } else if (bmiValue >= 25 && bmiValue < 30) {
                        bmiRange = 'overweight';
                    } else if (bmiValue >= 30) {
                        bmiRange = 'obese';
                    }

                    if (bmiRange) {
                        window.whyWeight.saveAnswer('bmi-range', bmiRange);
                    }
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

        // Bind summary generation for results slide
        bindSummaryGeneration: function () {
            const self = this;

            // When navigating to the results slide via any navigation method, generate the summary
            $(document).on('click', '[data-navigate="results"]', function () {
                self.generateSummary();
            });

            // When navigating to contact slide, populate the textarea
            $(document).on('click', '[data-navigate="contact"]', function () {
                self.populateTextarea();
            });
        },

        // Generate and display a summary (keep empty for now)
        generateSummary: function () {
            console.log('WhyWeight: Summary generation requested');
            // We won't replace any content, just log this call
        },

        // Populate the textarea with answers data
        populateTextarea: function () {
            const textarea = $('#wsf-1-field-5');
            if (!textarea.length) {
                console.error('WhyWeight: Textarea #wsf-1-field-5 not found');
                return;
            }

            // Create a formatted string of all answers
            let summaryText = 'Assessment Summary:\n\n';

            // Create simpler answer mappings for display
            const answerLabels = {
                'bmi': 'BMI',
                'bmi-range': 'BMI Category',
                'pregnancy': 'Pregnant or breastfeeding',
                'binge-eating': 'Binge eating',
                'exercise-program': 'Tried exercise program',
                'reduced-calorie': 'Tried reduced-calorie diet',
                'thyroid': 'History of MEN 2 or medullary thyroid cancer',
                'gallbladder': 'Active gallbladder issues or history of pancreatitis',
                'seizures': 'History of seizures or opiate pain medication use'
            };

            // Format yes/no answers
            const yesNoFormat = {
                'yes': 'Yes',
                'no': 'No'
            };

            // Handle height and weight first
            if (this.answers['height-feet'] || this.answers['height-inches']) {
                const feet = this.answers['height-feet'] || '0';
                const inches = this.answers['height-inches'] || '0';
                summaryText += `Height: ${feet}' ${inches}"\n`;
            }

            if (this.answers['weight-lbs']) {
                summaryText += `Weight: ${this.answers['weight-lbs']} lbs\n`;
            }

            // Loop through remaining answers
            for (const questionId in this.answers) {
                // Skip height and weight as they're already handled
                if (['height-feet', 'height-inches', 'weight-lbs'].includes(questionId)) {
                    continue;
                }

                const answer = this.answers[questionId];
                const label = answerLabels[questionId] || questionId;

                // Format the answer value (handle yes/no values)
                let displayValue = answer;
                if (yesNoFormat[answer]) {
                    displayValue = yesNoFormat[answer];
                } else if (questionId === 'bmi-range') {
                    // Capitalize the first letter of BMI range
                    displayValue = answer.charAt(0).toUpperCase() + answer.slice(1);
                }

                summaryText += `${label}: ${displayValue}\n`;
            }

            // Set the textarea value
            textarea.val(summaryText);
            console.log('WhyWeight: Textarea populated with assessment data');
        },

        // Reset all assessment data and UI elements
        resetAssessment: function () {
            // Clear the answers object
            this.answers = {};
            console.log('WhyWeight: Answers reset');

            // Reset all form inputs
            $('#height-feet, #height-inches, #weight-lbs').val('');
            $('#bmi-result').val('');

            // Uncheck all radio buttons
            $('.ww-radio input[type="radio"]').prop('checked', false);

            // Remove active classes from all buttons and radio options
            $('.ww-choice-btn, .ww-radio').removeClass('active');

            // Clear any dynamically generated content
            $('#wsf-1-field-5').val('');

            // Remove all data attributes from the assessment container except the original ones
            this.resetDataAttributes();

            // Go to the first slide
            this.goToSlide(0);

            console.log('WhyWeight: Assessment reset complete');
        },

        // Reset all data attributes added to the assessment container
        resetDataAttributes: function () {
            const $assessmentContainer = $('#assessment');

            if ($assessmentContainer.length) {
                // Get all attributes
                const attributes = Array.from($assessmentContainer[0].attributes);

                // Filter for data attributes that start with 'data-answer-'
                attributes.forEach(attr => {
                    if (attr.name.startsWith('data-answer-')) {
                        $assessmentContainer.removeAttr(attr.name);
                    }
                });

                console.log('WhyWeight: Assessment data attributes reset');
            }
        },

        // Save an answer to the answers object and update data attributes
        saveAnswer: function (questionId, answer) {
            this.answers[questionId] = answer;

            // Also update the assessment container's data attributes
            this.updateDataAttributes(questionId, answer);

            console.log('WhyWeight: Saved answer', questionId, answer);
            console.log('WhyWeight: Current answers:', this.answers);
        },

        // Update data attributes on the assessment container for a specific answer
        updateDataAttributes: function (questionId, answer) {
            const $assessmentContainer = $('#assessment');

            if ($assessmentContainer.length) {
                // Set the data attribute with the answer
                $assessmentContainer.attr(`data-answer-${questionId}`, answer);
                console.log(`WhyWeight: Set data-answer-${questionId}="${answer}" on assessment container`);
            } else {
                console.error('WhyWeight: Assessment container not found');
            }
        },

        // Go to a specific slide by index
        goToSlide: function (index) {
            if (this.swiper) {
                this.swiper.slideTo(index);
                console.log('WhyWeight: Navigated to slide', index);
            }
        },

        // Go to a specific slide by name
        navigateByName: function (slideName) {
            if (this.slideMap[slideName] !== undefined) {
                this.goToSlide(this.slideMap[slideName]);
                console.log('WhyWeight: Navigated to slide', slideName);
            } else {
                console.error('WhyWeight: Could not find slide named', slideName);
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

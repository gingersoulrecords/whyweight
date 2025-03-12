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
            //console.log('WhyWeight: Initializing');
            this.initSlideMap();
            this.initSwiper();
            this.bindGlobalHandlers();
            this.bindBMICalculator();
            this.bindRadioButtons();
            this.bindSummaryGeneration();
        },

        originalSlideOrder: [], // Will store slide names in their original DOM order
        isNavigating: false, // Global navigation lock


        // Create a mapping of slide names to slide indices
        initSlideMap: function () {
            // First, capture the original DOM order of slides
            this.originalSlideOrder = [];
            $('.swiper-slide').each(function (index) {
                const slideName = $(this).data('slide-name');
                if (slideName) {
                    window.whyWeight.originalSlideOrder.push(slideName);
                    //console.log(`WhyWeight: Original slide order ${index}: "${slideName}"`);
                }
            });

            // Then build the slide map as before
            $('.swiper-slide').each(function (index) {
                const slideName = $(this).data('slide-name');
                if (slideName) {
                    window.whyWeight.slideMap[slideName] = index;
                    //console.log(`WhyWeight: Mapped slide "${slideName}" to index ${index}`);
                }
            });
        },

        getNextSlideName: function (currentSlideName) {
            const currentIndex = this.originalSlideOrder.indexOf(currentSlideName);

            if (currentIndex === -1) {
                console.error(`WhyWeight: Could not find slide "${currentSlideName}" in original order`);
                return null;
            }

            if (currentIndex < this.originalSlideOrder.length - 1) {
                const nextSlideName = this.originalSlideOrder[currentIndex + 1];
                //console.log(`WhyWeight: Next slide after "${currentSlideName}" is "${nextSlideName}" (based on original DOM order)`);
                return nextSlideName;
            } else {
                //console.log(`WhyWeight: "${currentSlideName}" is the last slide in the original order`);
                return null;
            }
        },

        // Initialize the single Swiper instance
        initSwiper: function () {
            const sliderContainer = $('.ww-slider');

            if (sliderContainer.length === 0) {
                //console.log('WhyWeight: No slider container found');
                return;
            }

            //console.log('WhyWeight: Found slider container');

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

            //console.log('WhyWeight: Swiper initialized');
        },

        // Bind global handlers using event delegation
        bindGlobalHandlers: function () {
            const self = this;

            // Remove any existing handlers to prevent duplication
            $(document).off('click', '[data-navigate]');

            // Handle navigation buttons (delegated event)
            $(document).on('click', '[data-navigate]', function (e) {
                // Skip if this is a radio button (they're handled separately)
                if ($(this).hasClass('ww-radio') || $(this).closest('.ww-radio').length > 0) {
                    //console.log('WhyWeight: Skipping global navigation for radio button');
                    return;
                }

                // Skip if navigation is already in progress
                if (self.isNavigating) {
                    //console.log('WhyWeight: Navigation in progress, ignoring click');
                    return;
                }

                e.preventDefault();
                const navigateAction = $(this).data('navigate');
                //console.log('WhyWeight: Global navigation triggered:', navigateAction);

                // Set navigation lock
                self.isNavigating = true;
                //console.log('WhyWeight: Navigation lock activated');

                // Use setTimeout to ensure this completes after other handlers
                setTimeout(function () {
                    switch (navigateAction) {
                        case 'next':
                            const currentSlideName = $('.swiper-slide').eq(self.swiper.activeIndex).data('slide-name');

                            // Get explicit routing from checkRouting function
                            const targetSlideName = self.checkRouting(currentSlideName);

                            //console.log(`WhyWeight: Global next navigation: ${currentSlideName} -> ${targetSlideName}`);

                            if (targetSlideName) {
                                self.navigateByName(targetSlideName);
                            } else {
                                // Fallback to default next slide behavior
                                self.swiper.slideNext();
                            }
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

                    //console.log(`WhyWeight: Navigated ${navigateAction}`);

                    // Release navigation lock after a delay
                    setTimeout(function () {
                        self.isNavigating = false;
                        //console.log('WhyWeight: Navigation lock released');
                    }, 300);
                }, 50);
            });

            //console.log('WhyWeight: Global handlers bound with improved navigation control');
        },

        // Bind radio button functionality for auto-navigation
        bindRadioButtons: function () {
            const self = this;

            // Remove any existing event handlers to prevent duplicates
            $(document).off('click', '.ww-radio');

            // Use click handler instead of change event - this works regardless of previous state
            $(document).on('click', '.ww-radio', function (e) {
                // Don't do anything if we're already navigating
                if (self.isNavigating) {
                    //console.log('WhyWeight: Navigation in progress, ignoring radio click');
                    return;
                }

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
                let navigateTo = $span.data('navigate');

                // console.log('Radio clicked:', {
                //     questionId,
                //     answer,
                //     navigateTo
                // });

                // Save the answer
                if (questionId) {
                    self.saveAnswer(questionId, answer);

                    // Handle special case for pregnancy "yes" answer
                    if (questionId === 'pregnancy' && answer === 'yes') {
                        // Override the navigateTo to point to not-now instead of pregnancy-info
                        navigateTo = 'not-now';
                        //console.log('WhyWeight: Pregnancy is yes, routing to not-now slide');
                    }
                }

                // CRITICAL FIX: Stop event propagation to prevent the global [data-navigate] handler from firing
                if (navigateTo) {
                    e.stopPropagation();

                    // Set navigation lock
                    self.isNavigating = true;
                    //console.log('WhyWeight: Navigation lock activated');

                    // Process navigation after a small delay
                    setTimeout(function () {
                        //console.log('WhyWeight: Processing radio button navigation to:', navigateTo);

                        if (navigateTo === 'next') {
                            const currentSlideName = $('.swiper-slide').eq(self.swiper.activeIndex).data('slide-name');

                            // Check for conditional routing
                            const nextSlideName = self.checkRouting(currentSlideName);

                            //console.log(`WhyWeight: Radio next navigation: ${currentSlideName} -> ${nextSlideName}`);

                            if (nextSlideName) {
                                self.navigateByName(nextSlideName);
                            } else {
                                self.swiper.slideNext();
                            }
                        } else {
                            self.navigateByName(navigateTo);
                        }

                        // Release navigation lock after a delay
                        setTimeout(function () {
                            self.isNavigating = false;
                            //console.log('WhyWeight: Navigation lock released');
                        }, 300);
                    }, 50);
                }
            });

            //console.log('WhyWeight: Radio button handlers bound with improved navigation control');
        },

        // Bind BMI calculator functionality
        // Add this function to the whyWeight object
        bindBMICalculator: function () {
            const heightFeetInput = $('#height-feet');
            const heightInchesInput = $('#height-inches');
            const weightInput = $('#weight-lbs');
            const bmiResult = $('#bmi-result');
            const nextButton = $('.swiper-slide[data-slide-name="bmi"] button[data-navigate="next"]');

            // Initially disable the next button
            nextButton.attr('disabled', 'disabled').addClass('disabled');

            const validateForm = function () {
                const feet = parseFloat(heightFeetInput.val()) || 0;
                const inches = parseFloat(heightInchesInput.val()) || 0;
                const weight = parseFloat(weightInput.val()) || 0;

                // Check if all required fields have valid values
                const isValid = (feet >= 4 && feet <= 8) &&
                    (inches >= 0 && inches <= 11) &&
                    (weight >= 50 && weight <= 500);

                // Enable/disable next button based on validation
                if (isValid) {
                    nextButton.removeAttr('disabled').removeClass('disabled');
                } else {
                    nextButton.attr('disabled', 'disabled').addClass('disabled');
                }

                return isValid;
            };

            const calculateBMI = function () {
                const feet = parseFloat(heightFeetInput.val()) || 0;
                const inches = parseFloat(heightInchesInput.val()) || 0;
                const weight = parseFloat(weightInput.val()) || 0;

                // Calculate total height in inches
                const totalInches = (feet * 12) + inches;

                if (totalInches > 0 && weight > 0) {
                    // BMI formula: (weight in pounds * 703) / (height in inches)²
                    const bmiValue = ((weight * 703) / (totalInches * totalInches));
                    const bmiFormatted = bmiValue.toFixed(1);
                    bmiResult.val(bmiFormatted);

                    // Save BMI to answers - store as a number for accurate comparisons
                    window.whyWeight.saveAnswer('bmi', bmiValue);

                    // Also add a calculated BMI range
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

                    // Log information for debugging
                    //console.log(`WhyWeight: Calculated BMI is ${bmiValue} (${bmiFormatted}) - ${bmiRange}`);
                    //console.log(`WhyWeight: BMI routing would go to: ${bmiValue < 25 ? 'not-now' : 'pregnancy'}`);
                } else {
                    bmiResult.val('');
                }

                // Validate form after calculating BMI
                validateForm();
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

        checkRouting: function (currentSlideName) {
            // Special routing for BMI slide
            if (currentSlideName === 'bmi') {
                // Get the BMI value and ensure it's treated as a number
                const bmiRaw = this.answers['bmi'];
                const bmiValue = parseFloat(bmiRaw || 0);

                // Add debugging info
                //console.log(`WhyWeight Debug: Current BMI value is "${bmiRaw}" (raw) and ${bmiValue} (parsed)`);

                // If BMI is less than 25, route to not-now slide
                if (bmiValue > 0 && bmiValue < 25) {
                    //console.log(`WhyWeight: BMI ${bmiValue} is < 25, routing to not-now slide`);
                    return 'not-now';
                } else if (bmiValue >= 25) {
                    //console.log(`WhyWeight: BMI ${bmiValue} is >= 25, routing to pregnancy slide`);
                    return 'pregnancy';
                }
            }

            // Default is to follow the normal flow
            return this.getNextSlideName(currentSlideName);
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
            //console.log('WhyWeight: Summary generation requested');
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
            //console.log('WhyWeight: Textarea populated with assessment data');
        },

        // Reset all assessment data and UI elements
        resetAssessment: function () {
            // Clear the answers object
            this.answers = {};
            //console.log('WhyWeight: Answers reset');

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

            //console.log('WhyWeight: Assessment reset complete');
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

                //console.log('WhyWeight: Assessment data attributes reset');
            }
        },

        // Save an answer to the answers object and update data attributes
        saveAnswer: function (questionId, answer) {
            this.answers[questionId] = answer;

            // Also update the assessment container's data attributes
            this.updateDataAttributes(questionId, answer);

            //console.log('WhyWeight: Saved answer', questionId, answer);
            //console.log('WhyWeight: Current answers:', this.answers);
        },

        // Update data attributes on the assessment container for a specific answer
        updateDataAttributes: function (questionId, answer) {
            const $assessmentContainer = $('#assessment');

            if ($assessmentContainer.length) {
                // Set the data attribute with the answer
                $assessmentContainer.attr(`data-answer-${questionId}`, answer);
                //console.log(`WhyWeight: Set data-answer-${questionId}="${answer}" on assessment container`);
            } else {
                console.error('WhyWeight: Assessment container not found');
            }
        },

        // Go to a specific slide by index
        goToSlide: function (index) {
            if (this.swiper) {
                this.swiper.slideTo(index);
                //console.log('WhyWeight: Navigated to slide', index);
            }
        },

        // Go to a specific slide by name
        navigateByName: function (slideName) {
            if (this.slideMap[slideName] !== undefined) {
                this.goToSlide(this.slideMap[slideName]);
                //console.log('WhyWeight: Navigated to slide', slideName);
            } else {
                console.error('WhyWeight: Could not find slide named', slideName);
            }
        },

        clearNavigationLock: function () {
            // Emergency function to clear navigation lock if something goes wrong
            this.isNavigating = false;
            //console.log('WhyWeight: Navigation lock cleared by emergency function');
        }
    };

    // Document ready
    $(function () {
        //console.log('WhyWeight: DOM ready');

        // Test if Swiper exists
        if (typeof Swiper === 'function') {
            //console.log('WhyWeight: Swiper is loaded successfully');

            // Initialize WhyWeight
            window.whyWeight.init();
        } else {
            console.error('WhyWeight: Swiper is not loaded');
        }
    });

})(jQuery);

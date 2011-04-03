/**
 * html5 forms module. Yep it's another bicycle. 
 * Dependencies: jQuery
 */

(function($) {
	/**
	 * Test for native host method
	 */
	var isHostMethod = function(o, m) {
		var t = typeof o[m], reFeaturedMethod = 
			new RegExp('^function|object$', 'i');
		return !!((reFeaturedMethod.test(t) && o[m]) || t == 'unknown');
	};

	var isTypeSupported = function(o, t) {
		o.setAttribute('type', t);
		return o.type !== "text";
	};

	// All tests here
	var prey = document.createElement("input"); // Our prey
	var isNative = {
		inputType : {
			email : isTypeSupported(prey, 'email'),
			url : isTypeSupported(prey, 'url'),
			number : isTypeSupported(prey, 'number'),
			date : isTypeSupported(prey, 'date'),
			date : isTypeSupported(prey, 'range')
		},
		inputAttr : {
			placeholder : !!("placeholder" in prey),
			required : !!('required' in prey),
			pattern : !!('pattern' in prey),
			min : !!('min' in prey),
			max : !!('max' in prey)
		},
		hostMethod : {
			validity : isHostMethod(prey, 'validity'),
			checkValidity : isHostMethod(prey, 'checkValidity'),
			setCustomValidity : isHostMethod(prey, 'setCustomValidity')
		}
	};

	/**
	 * Placeholder setup. Sorry it's formely copy-paste from 
	 * awesome http://github.com/danielstocks/jQuery-Placeholder.
	 * Thank's Daniel Stocks.
	 * But I don't need many bindings to submit.
	 */
	var setupPlaceholder = (function() {
		if (!isNative.inputAttr.placeholder) {
			/**
			 * Placeholder object.
			 */
			var Placeholder = function(input) {
		        this.input = input;
		        if (input.attr('type') == 'password') {
		            this.handlePassword();
		        }
		    }
		    
		    Placeholder.prototype = {
		        show : function(loading) {
		            // FF and IE saves values when you refresh the page. 
		        	// If the user refreshes the page with
		            // the placeholders showing they will be the default 
		        	// values and the input fields won't be empty.
		            if (this.input[0].value === '' 
		            	|| (loading && this.valueIsPlaceholder())) {
		                if (this.isPassword) {
		                    try {
		                        this.input[0].setAttribute('type', 'text');
		                    } catch (e) {
		                        this.input.before(this.fakePassword.show())
		                        .hide();
		                    }
		                }
		                this.input.addClass('placeholder');
		                this.input[0].value = this.input.attr('placeholder');
		            }
		        },
		        hide : function() {
		            if (this.valueIsPlaceholder() 
		            		&& this.input.hasClass('placeholder')) {
		                this.input.removeClass('placeholder');
		                this.input[0].value = '';
		                if (this.isPassword) {
		                    try {
		                        this.input[0].setAttribute('type', 'password');
		                    } catch (e) { }
		                    // Restore focus for Opera and IE
		                    this.input.show();
		                    this.input[0].focus();
		                }
		            }
		        },
		        valueIsPlaceholder : function() {
		            return this.input[0].value == 
		            	this.input.attr('placeholder');
		        },
		        handlePassword: function() {
		            var input = this.input;
		            input.attr('realType', 'password');
		            this.isPassword = true;
		            // IE < 9 doesn't allow changing the type 
		            // of password inputs
		            if ($.browser.msie && input[0].outerHTML) {
		                var fakeHTML = $(input[0].outerHTML.replace(
		                		/type=(['"])?password\1/gi, 'type=$1text$1'));
		                this.fakePassword = fakeHTML.val(
		                		input.attr('placeholder'))
		                		.addClass('placeholder').focus(function() {
		                    input.trigger('focus');
		                    $(this).hide();
		                });
		                $(input[0].form).submit(function() {
		                    fakeHTML.remove();
		                    input.show()
		                });
		            }
		        }
		    };
		    
		    // Setup all placeholder bindings if needed
		    return function($$, opts) {
		    	var domField = $$.get(0);
		    	if ($$.attr('placeholder')) {
		    		// Setup 
		    		domField.control.value = function() {
						var phVal = $$.attr('placeholder');
						var val = $$.val();
						return (!!phVal 
								&& $$.hasClass(opts.classes.placeholder) 
								&& val === phVal) ? "" : val;
					}
		    		
		    		var placeholder = new Placeholder($$);
		    		placeholder.show(true);
		    		$$.focus(function() {
		    			placeholder.hide();
		    		})
		    		.blur(function() {
		    			placeholder.show(false);
		    		});
		    		
		    		// On page refresh, IE doesn't re-populate user input
		    		// until the window.onload event is fired.

		            if ($.browser.msie) {
		                $(window).load(function() {
		                    if($$.val()) {
		                        $$.removeClass("placeholder");
		                    }
		                    placeholder.show(true);
		                });
		                // What's even worse, the text cursor disappears
		                // when tabbing between text inputs, here's a fix
		                $$.focus(function() {
		                    if(this.value == "") {
		                        var range = this.createTextRange();
		                        range.collapse(true);
		                        range.moveStart('character', 0);
		                        range.select();
		                    }
		                });
		            }
		    	} else {
		    		domField.control.value = function() {
		    			return domField.value;
		    		};
		    	}
		    }
		} else {
			// Ok just setup .control.value() function
			return function ($$, opts) {
				$$.get(0).control.value = function() {
					return $$.get(0).value;
				};
			}
		}
	})();
	
	/**
	 * Low level field setup
	 * @returns Setup function
	 */
	var lowSetupField = (function() {
		if (!isNative.hostMethod.validity) {
			// Hard work no HTML5 Forms support
			var isPattern = function(value, pattern) {
				return pattern.test(value);
			};

			var patterns = {
				'email' : new RegExp("^[a-z0-9_.%+-]+@[0-9a-z.-]"
						+ "+\\.[a-z.]{2,6}$", "i"),
				'url' : new RegExp("[a-z][-\.+a-z]*:\/\/", "i")
			};

			return function($$, opts) {
				var domField = $$.get(0);
				var fieldType = domField.getAttribute('type');

				// Basic validity object and message
				domField.validationMessage = '';
				domField.validity = {
					customError : false,
					patternMismatch : false,
					rangeOverflow : false,
					rangeUnderflow : false,
					stepMismatch : false,
					tooLong : false,
					typeMismatch : false,
					valid : true,
					valueMissing : false
				};

				// All possible checks
				var all = [
				{ // Custom error
					check : true,
					op : function() {
						if (domField.validity.customError) {
							return domField.validationMessage;
						}
					}
				},
				{ // Required
					check : $$.attr('required') !== undefined,
					op : function() {
						if (domField.control.value() === "") {
							domField.validity.valueMissing = true;
							return opts.messages.required;
						} else {
							domField.validity.valueMissing = false;
						}
					}
				},
				{ // E-mail
					check : fieldType === 'email',
					op : function() {
						var val = domField.control.value();
						if (!isPattern(val, patterns.email) && val !== "") {
							domField.validity.typeMismatch = true;
							return opts.messages.email;
						} else {
							domField.validity.typeMismatch = false;
						}
					}
				},
				{ // URL
					check : fieldType === 'url',
					op : function() {
						var val = domField.control.value();
						if (!isPattern(val, patterns.url) && val !== "") {
							domField.validity.typeMismatch = true;
							return opts.messages.url;
						} else {
							domField.validity.typeMismatch = false;
						}
					}
				},
				{ // Number
					check : fieldType === 'number',
					op : function() {
						var val = domField.control.value();
						if (isNaN(val) && val !== "") {
							domField.validity.typeMismatch = true;
							return opts.messages.number;
						} else {
							domField.validity.typeMismatch = false;
						}
					}
				},
				{ // Pattern
					check : $$.attr('pattern') !== undefined,
					op : function() {
						var val = domField.control.value();
						var pattern = new RegExp($$.attr('pattern'));
						if (!pattern.test(val) && val !== "") {
							domField.validity.patternMismatch = true;
							return opts.messages.pattern;
						} else {
							domField.validity.patternMismatch = false;
						}
					}
				}
				];

				// Filter checks for field
				var chain = [];
				for ( var i = 0; i < all.length; i++) {
					if (all[i].check)
						chain.push(all[i].op);
				}

				/**
				 * Validate function
				 */
				var validate = domField.control.validate = function() {
					// Fire all checks
					var msg = undefined;
					for ( var i = 0; i < chain.length; i++) {
						var lastMsg = chain[i]();
						if (!!lastMsg && !!!msg) {
							msg = lastMsg;
						}
					}
					
					// Set validity and validation message
					domField.validationMessage = msg || "";
					domField.validity.valid = (
							!domField.validity.customError
							&& !domField.validity.valueMissing
							&& !domField.validity.tooLong
							&& !domField.validity.typeMismatch
							&& !domField.validity.patternMismatch
							&& !domField.validity.rangeOverflow
							&& !domField.validity.rangeUnderflow 
							&& !domField.validity.stepMismatch);
					
					// And set needed classes
					if (domField.validity.valid) {
						$$.removeClass(opts.classes.invalid)
							.addClass(opts.classes.valid);
					} else {
						$$.removeClass(opts.classes.valid)
							.addClass(opts.classes.invalid);
					}
				};

				// Bind and validate
				$$.bind('keyup focus blur', validate);
				domField.control.validate();

				// Define setCustomValidity method
				if (!isNative.hostMethod.setCustomValidity) {
					domField.setCustomValidity = function(msg) {
						domField.validity.customError = !!msg;
						domField.validationMessage = msg || '';
						domField.control.validate();
					}
				}

				// Define checkValidity method
				if (!isNative.hostMethod.checkValidity) {
					domField.checkValidity = function() {
						$$.trigger('invalid');
						return domField.validity.valid;
					}
				}
			};
		} else {
			return function() {}
		}
	})();

	$.fn.f5 = function(options) {
		var settings = {
			submit : function() { // Submit
				return true;
			},
			validators : {}, // Validators
			poll : 300, // Poll time in milliseconds
			classes : {
				valid : 'valid',
				invalid : 'invalid',
				required : 'required',
				placeholder : 'placeholder',
				pending : 'pending'
			},
			messages : {
				required : "Please fill out this field.",
				pattern : "Please match the requested format.",
				email : "Please enter an email address.",
				url : "Please enter URL",
				number : "Please enter numeric value",
				max : "Value too large",
				min : "Value too small"
			}
		};

		if (options) {
			$.extend(true, settings, options);
		}

		return this.filter('form').each(function() {
			var $form = $(this);

			// if already binded - do nothing
			if ($form.data('f5'))
				return;

			$form.data('f5', {
				members : []
			});

			$(':input:not(:submit):not(:reset)', $form).each( function() {
				var $field = $(this); // jQuery

				// Control object
				$field.get(0).control = {};

				setupPlaceholder($field, settings);
				lowSetupField($field, settings);
			});

			// Setup form checkValidity
			if (!isHostMethod($form.get(0), 'checkValidity')) {
				var domForm = $form.get(0);
				domForm.checkValidity = function() {
					var first = true;
					$(':input:not(:submit):not(:reset)', 
							$form).each(function() {
							if (!$(this).get(0).checkValidity())
								all = false;
					});
					return all;
				};
				
				// And bind on submit
				$form.bind('submit', function() {
							// Check states
					var invalidFields = $(':input:not(:submit):not(:reset)',
							$form).filter( function() {
						return !$(this).get(0).validity.valid;
					});
					if (invalidFields.length == 0) {
						$(':input:not(:submit):not(:reset)', 
								$form).each( function() {
							$this = $(this);
							$this.val($this.get(0).control.value());
						});
						return true;
					} else {
						invalidFields.filter(':first').focus();
						domForm.checkValidity();
						return false;
					}
				});
			}
		});
	};
})(jQuery);
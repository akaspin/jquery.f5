/**
 * jquery.f5 v0.2
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

	// All tests here
	var prey = document.createElement("input"); // Our prey
	var isNative = {
		inputAttr : {
			required : !!('required' in prey),
			pattern : !!('pattern' in prey),
			min : !!('min' in prey),
			max : !!('max' in prey)
		},
		hostMethod : {
			validity : isHostMethod(prey, 'validity'),
			checkValidity : isHostMethod(prey, 'checkValidity'),
			setCustomValidity : isHostMethod(prey, 'setCustomValidity'),
			valueAsNumber: isHostMethod(prey, 'valueAsNumber'),
			valueAsDate: isHostMethod(prey, 'valueAsDate')
		}
	};
	
	/**
	 * Low level field setup
	 * @returns Setup function
	 */
	var lowSetupField = (function() {
		if (isNative.hostMethod.validity) {
			return function() {};
		}
		
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

			// Add required if needed
			if ($$.attr('required') !== undefined) {
				$$.addClass(opts.classes.required);
			}
			
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
					if (domField.value === "") {
						domField.validity.valueMissing = true;
						return opts.messages.required;
					} else {
						domField.validity.valueMissing = false;
					}
				}
			},
			{ // E-mail or URL
				check : fieldType === 'email' || fieldType === 'url',
				op : function() {
					var val = domField.value;
					if (!isPattern(val, patterns[fieldType]) && val !== "") {
						domField.validity.typeMismatch = true;
						return opts.messages[fieldType];
					} else {
						domField.validity.typeMismatch = false;
					}
				}
			},
			{ // Number
				check : fieldType === 'number',
				op : function() {
					var val = domField.value;
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
					var val = domField.value;
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
			if ($.browser.msie) {
				$$.bind('keyup change', function() {
					$(this).trigger('input');
				});
			}
			$$.bind('input change', validate);
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
					var state = !!domField.validity && domField.validity.valid
					$$.trigger(state ? 'valid' : 'invalid');
					return state;
				}
			}
		};
	})();

	/**
	 * Setup error on field
	 */
	var setupFieldError = function($$, opts) {
		// Aiming to 'validity' object
		if (!isNative.hostMethod.validity || opts.error.force) {
			$$.get(0).control.error = opts.error.create.apply($$);
			$$.bind('invalid', function(event) {
				$(this.control.error).text(this.validationMessage);
				event.preventDefault();
				$(this).focus();
			})
			if ($.browser.msie) {
				// IE not redraw CSS "+" or "~" rules
				$$.bind('valid', function() {
					$(this.control.error).text('');
				})
				.bind('focus', function() {
					$(this.control.error).show();
				})
				.bind('blur', function() {
					$(this.control.error).hide();
				})
			}
		}
	};
	
	$.fn.f5 = function(options) {
		var settings = {
			classes : {
				valid : 'valid',
				invalid : 'invalid',
				required : 'required'
			},
			messages : {
				required : "Please fill out this field.",
				pattern : "Please match the requested format.",
				email : "Please enter an email address.",
				url : "Please enter URL",
				number : "Please enter numeric value",
				max : "Value too large",
				min : "Value too small"
			},
			error: {
				force: false,		// Force messages in modern browsers
				create: function(){ // Error creation function
					var err = $('<span class="error"></span>');
	                $(this).after(err);
	                return err;
				}
			}
		};

		options = !!options ? options : {};
		options = $.extend(true, settings, options);

		return this.filter('form').each(function() {
			var $form = $(this);

			$(':input:not(:submit):not(:reset)', $form).each( function() {
				var $field = $(this); // jQuery

				// Control object
				$field.get(0).control = {};

				setupFieldError($field, settings);
				lowSetupField($field, settings);
			});

			// Setup form checkValidity and submit
			var formCheckVal = isHostMethod($form.get(0), 'checkValidity');
			
			if (!formCheckVal) {
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
			}
			
			if (!formCheckVal) {
				// And bind on submit
				$form.bind('submit', function(event) {
					// Check states
					var invalidFields = $(':input:not(:submit):not(:reset)',
							$form).filter( function() {
								return !$(this).get(0).validity.valid;
							});
					if (invalidFields.length == 0) {
						$(':input:not(:submit):not(:reset)', 
								$form).each( function() {
									$this = $(this);
									$this.val($this.get(0).value);
								});
						return true;
					} else {
						$form.get(0).checkValidity();
						invalidFields.filter(':first').select();
						return false;
					}
				});
			}
		});
	};
})(jQuery);

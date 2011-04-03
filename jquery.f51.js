(function($) {
	
	/**
	 * Get validity without customError
	 */
	var fakeValidity = function($$) {
		var field = $$.get(0);
		var async = field.control.async;
		var validity = field.validity;

		var result = (async.error == validity.customError 
				   	  && async.message == field.validationMessage
				      && (!validity.valueMissing
							&& !validity.tooLong
							&& !validity.typeMismatch
							&& !validity.patternMismatch
							&& !validity.rangeOverflow
							&& !validity.rangeUnderflow 
							&& !validity.stepMismatch));
		
		return result;
	};
	
	/**
	 * 
	 */
	var setAsyncState = function($$, msg, opts) {
		var domField = $$.get(0);
		var async = domField.control.async;
		async.message = msg;
		async.error = !!msg;
		if (msg == opts.messages.pending) {
			$$.addClass(opts.classes.pending);
		} else {
			$$.removeClass(opts.classes.pending);
		}
	}
	
	var setupField = function($$, form, opts) {
		var field = $$.get(0); 

		// Setup validator function
		if (field.control) {
			var op = opts.validators[$$.attr('validate')];
			if (op)	{
				// op defined - bind it
				field.control.async = {
					value: '', 		// Last value
					pending: false,	// Pending state
					error: false,	// Error state
					message: ''
				};
				
				$$.bind('keyup change', function() {
					var $$ = $(this);
					var field = $$.get(0);
					var value = field.control.value();
					var async = field.control.async;
					
					if (!!value && async.value !== value) {
						async.value = value;
						// If pending - clear it
						if (async.pending != false) {
							clearTimeout(async.pending);
							async.pending = false;
						}
						
						// Discover state:
						if (fakeValidity($$)) {
							
							// ok. Set pending states
							setAsyncState($$, opts.messages.pending, opts);
							field.setCustomValidity(opts.messages.pending);
							
							// And fire op
							async.pending = setTimeout(function() {
								op(value, function(msg) {
									var async = field.control.async;
									var message = msg || '';
									if (field.control.value() == async.value) {
										async.pending = false;

										if (fakeValidity($$)) {
											setAsyncState($$, message, opts);
											field.setCustomValidity(message);
											form.trigger('state');
										} else {
											setAsyncState($$, '', opts);
										}
										
									}
								});
							}, opts.poll);
							
						} else {
							// Another message
							setAsyncState($$, '', opts);
						}
					}
				});
			} else {
				$$.bind('keyup change', function() {
					form.trigger('state');
				});
			};
		}
	}
	
	$.fn.f51 = function(options) {
		var settings = {
			classes: {
				pending: 'pending'
			},
			messages: {
				pending: 'Checking...'
			},
			submit: function() { // Submit
				return true;
			},
			validators: {}, // Validators
			poll : 300 // Poll time in milliseconds
		}

		if (options) {
			$.extend(true, settings, options);
		}
		
		// Polyfill with f5
		return this.f5(settings).each(function() {
			var $form = $(this);
			
			$(':input:not(:submit):not(:reset)', $form).each(function() {
				setupField($(this), $form, settings);
			});
			
			$form.bind('state', function() {
				if (!!$(":input", this).filter(function() {
					return this.validity && !this.validity.valid;
					}).length) {
					$(':submit', this).attr("disabled", "true");
				} else {
					$(':submit', this).removeAttr("disabled");
				};
			});
			
			$form.trigger('state');
			
			// bind submit
			$form.bind('submit', function() {
				if ($form.get(0).checkValidity()) {
					settings.submit.apply(this);
				}
			});
		});
	}
})(jQuery);
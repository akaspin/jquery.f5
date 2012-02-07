/**
 * jquery.f51 v0.1
 */

(function($) {
	
	/**
	 * Returns true if vield error generated in async phase.
	 * 
	 */
	var isAsyncClear = function(field) {
		var async = field.control.async;
		
		return !async.error || async.message == field.validationMessage;
	}
	
	/**
	 * Get validity without customError
	 */
	var isSysValid = function(field) {
		var validity = field.validity;

		return (!validity.valueMissing
				&& !validity.tooLong
				&& !validity.typeMismatch
				&& !validity.patternMismatch
				&& !validity.rangeOverflow
				&& !validity.rangeUnderflow 
				&& !validity.stepMismatch);
	};
	
	/**
	 * Set async op state
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
	
	/**
	 * Setup field
	 */
	var setupField = function($$, form, opts) {
		var field = $$.get(0); 

		// Setup validator function
		if (field.control) {
			var op = opts.validators[$$.attr('validate')];
			if (op)	{
				// op defined - bind it
				field.control.async = {
					value: '', 		// Last value
					pending: undefined,	// Pending state
					error: false,	// Error state
					message: ''
				};
				
				$$.bind('input change', function() {
					var $$ = $(this);
					var field = $$.get(0);
					var value = field.control.value();
					var async = field.control.async;
					
					var clearAsync = function() {
						setAsyncState($$, '', opts);
						clearTimeout(async.pending);
						async.value = field.control.value();
						form.trigger('state');
					}
					
					if (!isAsyncClear(field)) {
						// Custom errors present - clear async
						clearAsync();
						return;
					}
					
					// Now async state must be clear
					// Check for "system" validity
					if (!isSysValid(field) || !!!value) {
						// Not clean
						field.setCustomValidity();
						clearAsync();
						return;
					}
					
					// Ok. all clean. 
					if (async.value !== value) {
						async.value = value;
						clearTimeout(async.pending);
						
						setAsyncState($$, opts.messages.pending, opts);
						field.setCustomValidity(opts.messages.pending);
						field.checkValidity();
						
						async.pending = setTimeout(function() {
							op.apply(field, [function(newMsg) {
								newMsg = newMsg || '';
								if (field.control.value() == async.value
										&& isAsyncClear(field) 
										&& isSysValid(field)) {
									setAsyncState($$, newMsg, opts);
									field.setCustomValidity(newMsg);
									form.trigger('state');
								} else {
									clearAsync();
									form.trigger('state');
								}
							}]);
						}, opts.poll);
					}
				});
			} else {
				$$.bind('input change', function() {
					form.trigger('state');
				});
			};
		}
	}
	
	$.fn.f51 = function(options) {
		var settings = {
			classes: { pending: 'pending' },
			messages: { pending: 'Checking...' },
			error: { force: true },
			submit: function() { // Submit
				return true;
			},
			validators: {}, // Validators
			poll : 500 // Poll time in milliseconds 
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
						return this.validity && !this.checkValidity();
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
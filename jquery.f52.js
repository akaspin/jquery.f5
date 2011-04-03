(function($) {

	/**
	 * Get field value. Regardless of placeholder.
	 */
	var getValue = function(el, settings) {
		if (el.hasClass(settings.options.placeholderClass) && 
				el.attr('placeholder') == el.val()) {
			return "";
		} else {
			return el.val();
		}
	}
	
	var setupField = function($input, $form, settings) {
		// Register
		var formData = $form.data('f5');
		if ($.inArray($input, formData.members) == -1) {
			formData.members.push($input);
		}
		
		var op = settings.validators[$input.attr('validate')];
		
		if (typeof op === 'function') {
			$input.data('f5', {
				value: undefined,
				pending: false
			});
			
			$input.bind('validate', {op: op}, function(event) {
				var $this = $(this);
				var data = $this.data('f5');
				var op = event.data.op;
				
				// if validator is present
				var val = getValue($this, settings);
				
				if (val != data.value) {
					// And value changed
					data.value = val;
					
					if (data.pending != false) {
						clearTimeout(data.pending);
						data.pending = false;
					}
					
					// Clear custom errors
					if ($this.get(0).validity.customError) {
						$this.get(0).setCustomValidity('');
					}
					
					if ($this.get(0).checkValidity()) {
						$this.addClass(settings.options.pendingClass);
						
						$this.get(0).setCustomValidity(
								settings.options.pendingMessage);
						
						$form.triggerHandler('f5_check');
						
						data.pending = setTimeout(function() {
							op(val, function(msg) {
								if (val == getValue($this, settings)) {
									data.pending = false;
									$this.removeClass(
											settings.options.pendingClass);
									var message = msg || '';
									$this.get(0).setCustomValidity(message);
									$form.triggerHandler('f5_check');
								}
							});
						}, settings.poll);
					} else {
						$form.triggerHandler('f5_check');
					}
				}
			});
		} else {
			$input.bind('validate', function() {
				$form.triggerHandler('f5_check');
			});
		}
		
		$input.bind('keyup focus blur', function(event) {
			$(this).triggerHandler('validate');
		});
		
		$input.triggerHandler('validate');
	}
	
	$.fn.f5 = function(options) {
		var settings = {
				submit: function() {	// Submit
					return true;
				},
				validators: {}, 		// Validators 
				poll: 300,				// Poll time in milliseconds 
				options: {				// H5F options
					validClass: "valid",
				    invalidClass: "invalid",
				    requiredClass: "invalid",
				    placeholderClass: "placeholder",
				    pendingClass: "pending",
				    pendingMessage: "Requesting"
				}
		};
		
		if (options) {
			$.extend(true, settings, options);
		}
		
		return this.filter('form').each(function() {
			var $form = $(this);
			
			// if already binded - do nothing
			if ($form.data('f5')) return;

			$form.data('f5', { members: [] })
			
			// Polyfill form with H5F
			var formDom = $form.get(0);
			H5F.setup(formDom, settings.options);

			
			// Bind check events
			$form.bind('f5_check', function() {
				var $this = $(this);
				var data = $this.data('f5');
				
				for (var i = 0; i < data.members.length; i++) {
					if (!data.members[i].get(0).checkValidity()) {
						$(':submit', $this).attr("disabled", "true");
						return;
					}
				}
				$(':submit', $this).removeAttr("disabled");
			});
			
			// Bind submit
			$form.bind('submit', function() {
				$(':input:not(:submit):not(:reset)', $form).each(function() {
					$el = $(this);
					$el.val(getValue($el, settings));
				})
				
				return settings.submit.apply(this);
			});
			
			$(':input:not(:submit):not(:reset)', $form).each(function() {
				var $this = $(this);
				setupField($this, $form, settings);
			})
		});
	};
})(jQuery);
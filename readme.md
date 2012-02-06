# Fork

* Original code: https://github.com/akaspin/jquery.f5
* Fork by Marcel Beumer: https://github.com/marcelbeumer/jquery.f5
* Modified by marcel@marcelbeumer.com to:
* Make it pass jshint
* Enable f5 based behavior for all browsers by default
* Removed default error renderer
* Added show/hide handler for more control over message display
* Don't block submits for non-native browsers
* Configurable messages for all browsers

# jquery.f5

Yep here is another bicycle for HTML 5 forms validation. *jQuery.f5* was 
was written for the following reasons:

* Brain-free usage.
* Avoiding treatment of builtin features.
* Low-level HTML5 form support: `validity` Object, `validationMessage` 
  property, form and field `checkValidity` and field `setCustomValidity` 
  methods.
* HTML5 input types support: `email`, `url`, `number`.
* HTML5 input attributes: `placeholder`, `required`, `pattern`.
* HTML5 field `invalid` and `input` events.

Only one dependency - [jQuery](http://jquery.com/).

`f5` tested on Chrome, MSIE 7+ and FF 3.6+.

## Usage

Add [jQuery](http://jquery.com/) and *jQuery.f5* scripts to your site and 
fire 'f5'. 

You can find basic example in `tests/test-f5-base.html`.

By default, *f5* tries to behave as close as possible to standart HTML5 forms. 
All differences due to the lack of some features in the old browsers.

## Low-level functions and events

`f5` provides standart HTML5 form low-level functions and properties.

`validity` object always represents field validity state. See 
[this](http://dev.w3.org/html5/spec/Overview.html#dom-cva-validity) 
for details.

`validationMessage` property always represents error message. See 
[this](http://dev.w3.org/html5/spec/Overview.html#dom-cva-validationmessage) 
for details.

`validity` and `validationMessage` updated with every change of the field.

`checkValidity` method returns `validity.valid` property of field, if value 
of this property is `false`, invokes `invalid` event. Form also has 
`checkValidity` method. On invocation, it invokes `checkValidity` of each field
and returns `false` if at least one field is invalid. You can find details 
[here](http://dev.w3.org/html5/spec/Overview.html#dom-cva-checkvalidatity).

For MSIE `f5`'s `checkValidity` method also fires `valid` events if field is 
valid.

With `setCustomValidity` method you can set a custom error message on a 
field and it will be in an invalid state until the custom message is set 
back to an empty string. Details 
[here](http://dev.w3.org/html5/spec/Overview.html#dom-cva-setcustomvalidity).

    
## Field value and placeholder

At this time, all implementations of placeholders in old browsers based on the 
replacement of an empty field value to a value of placeholder. And if you try 
to get the value of an empty field via element `value` property or jQuery 
`.val()` function, you get the value of placeholder.

To deal with this `f5` provide element `.control.value()` function:

    > $('your-field').val()
    < "Some placeholder"
    > $('your-field').get(0).control.value()
    < ""
    
`f5` also cleans field values before form submit.


## Validation chain

All restrictions of field in HTML5 are arrayed in a chain: `required`, field 
type, `pattern`, `min` and `max` for numbers.

For example, if you need a field with non-blank `email`, you must provide 
`required`.

    <input type='email' required> 

## Options

Without any options `f5` tries to behave as close as possible to standart HTML5 
forms. In following example `f5` is initialized with default options: 

    $('#form').f5({
        classes : {
            valid : 'valid',
            invalid : 'invalid',
            required : 'required',
            placeholder : 'placeholder'
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
            force: true,       // Force messages in modern browsers
            create: function() {
                throw new Error("Please define error create function");
            },
            show: function($el, msg) {},
            hide: function($el) {}
        }
    });

Let's dig them one by one.

### CSS

With `classes` option you can define own classes to form states. Of course 
this matters only for old browsers.

    $('#form').f5({
        classes : {
            valid : 'good',
            invalid : 'bad'
        }
    });

Old browsers not support `:valid`, `:invalid` and `:required` CSS 
pseudo-selectors. In order to deal with them `f5` uses CSS classes with the 
same names. So you need to define this rules in CSS:

    input[type=text].valid, input[type=text]:valid
    input[type=email].invalid, input[type=email]:invalid
    input[type=email].invalid.required, input[type=email]:invalid:required
    
Avoid to use `:not` pseudo-selector. *IE* handles it incorrectly.

Another bug in IE is ignoring `.` rule in set with `:`:

    input:valid, input.valid    <- not works in IE
    input.valid    <- works in IE

   
### Error messages

Old browsers don't know anything about error messages. By default `f5` 
provides simply english messages. You can override them with `messages` option:

    $('#form').f5({
        messages : {
            required : "Not blank please!"
        }
    });
 
For old browsers `f5` uses following mechanism to show error messages by 
default: after each input `f5` adds `span#error` element whose value is the 
last error message.

    <input type='email' class='invalid'>
     ^                         ^ added to represent state for old browsers
     | with "something" value for example                              
                               
    <span class='error focus'>Please enter an email address.</span>
     ^                  ^ last error message
     | this element added upon initialisation 
 
In CSS you can define rules to display message depending state of field via 
CSS sibling selectors (`+` or `~`):

    .error {
        color: #600;
        display: none;
    }

    input.invalid:focus + .error, textarea.invalid:focus + .error,
    input:invalid:focus + .error, textarea:invalid:focus + .error  {
        display: block;
    }

Webkit has bug with adjacent/general sibling selectors and pseudo classes. 
You can [fix](http://css-tricks.com/webkit-sibling-bug/) this by following 
bugfix:

    body { -webkit-animation: bugfix infinite 1s; }
    @-webkit-keyframes bugfix { from { padding: 0; } to { padding: 0; } }
    
To override default error messages you need provide `error.create` option:

    $('#form').f5({
        error: {
            create: function(){
                var err = $('Any stuff<span class="error"></span>');
                $(this).after(err);
                return err;
            }
        }
    });    

By default `f5` not sets error messages for modern browsers. To force `f5`'s 
error messages you need set `error.force` option to `true`.

    $('#form').f5({
        error: {
            force: true
        }
    });    

You can find example in `tests/test-f5-force.html`.

# jquery.f51: Dark side of power

Ok, `f5` was conceived with the dark intentions. So, `f51` is all about 
usability:

* Intellectual `submit` button. It never enabled if form contains invalid 
  fields.
* Brain-free async validation.
* Override `Submit` function. 

You can find example of `f51` in `tests/test-f51.html`.

`f51` takes all options of `f5`. By default `f51` forces error messages.

## Async validation

To validate field in asyncronous manner you need to do two things. First - 
add validator function to `f51` options:

    $('#form').f51({
        validators: {
            someValidator: function(callback){
                var that = this;
                // Long-long...
                setTimeout(function(){
                    (this.control.value() == 'somevalue') ? 
                        callback() : callback('Value must be "somevalue".');
                } ,3000);
            }
        }
    });

... And second - bind this validator to field:

    <input type='text' validate='someValidator' required 
        placeholder='Non-blank "somevalue".'>

Validator function takes one argument - callback function and executes in field 
context. Callback function takes one argument - message. field is considered 
correct if message is blank or `undefined`.  

Validator function will be invoked only if all builtin validations of field is 
passed and field hasn't custom error.

## Pending state

For time of async validation `f51` adds '.pending' class to field and sets 
"Checking..." custom error. You can define CSS rules for this:

    /* For input */
    input.pending {
        border-color: #DDC !important;
    }
    input.pending:focus {
        background-color: #FFFFF9;
    }

    /* ... and message */
    input.pending:focus ~ .error, textarea.pending:focus ~ .error {
        color: #777;
        display: block;
    }

Also you can override class and message by setting following options:

    $('#form').f51({
        // ...
        classes: { 
            pending: 'pending' 
        },
        messages: { 
            pending: 'Checking...' 
        }
    });
    
## Polling

`f51` tries to avoid unnecessary async validations. Async validation starts a 
bit later last change of field. You can change interval by setting `poll` 
option:

    $('#form').f51({
        // ...
        poll: 500 // 0.5 second
    });

## Submit override

Instead of banal sending form to server, you can do something own:

    $('#form').f51({
        submit: function() {
            alert($(this).serialize());
            return false;
        }
    });

This will provide a more predictable behavior than `jQuery.submit` because 
`f51` cleans and checks form before.



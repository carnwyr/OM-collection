$(document).ready(function(){
	$("input#username").on('focusout', checkUsername);
	$("input#password").on('keyup', checkPassword);
	$("input#confirmPassword").on('keyup', checkConfirmationPassword);
	$("button#signUp").on('click', checkSignUp);
});

function checkUsername(e) {
	var username = $("input#username").val();
	$.ajax({
        type: 'post',
        url: '/signup/checkUsername',
        data: {'username': username}
    })
    .done(function(data){
    	if (data === 'error') {
    		$("small#usernameError").html('Error');
    		return;
    	}
    	if (data) {
    		$("small#usernameError").html('Username already taken');
    	}
    	else {
    		if (username == '')
    			$("small#usernameError").html("Username can't be empty");
    		else
    			$("small#usernameError").html('');
    	}
    });
}

function checkPassword(e) {
	var password = $("input#password").val();
	var confirmPassword = $("input#confirmPassword").val();
	if (password.length < 8) {
		$("small#passwordError").html('Password must be at least 8 characters long');
		return;
	}
	if (password == '')
		$("small#passwordError").html("Password can't be empty");
	else
		$("small#passwordError").html('');
	if (password != confirmPassword) {
		$("small#passwordConfirmationError").html("Passwords don't match");
		return;
	}
	$("small#passwordConfirmationError").html("");
}

function checkConfirmationPassword(e) {
	var password = $("input#password").val();
	var confirmPassword = $("input#confirmPassword").val();
	if (password != confirmPassword) {
		$("small#passwordConfirmationError").html("Passwords don't match");
		return;
	}
	$("small#passwordConfirmationError").html("");
}

function checkSignUp(e) {
	if ($("small#usernameError").text() != '' || $("small#passwordError").text() != '' || $("small#passwordConfirmationError").text() != '') {
		e.preventDefault();
		return;
	}

	if ($("input#username").val() == '') {
		$("small#usernameError").text("Username can't be empty");
		e.preventDefault();
		return;
	}
	else {
		$("small#usernameError").text('');
	}

	if ($("input#password").val() == '') {
		$("small#passwordError").text("Password can't be empty");
		e.preventDefault();
		return;
	}
	else {
		$("small#passwordError").text('');
	}
}

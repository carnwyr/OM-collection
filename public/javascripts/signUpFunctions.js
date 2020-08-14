$(document).ready(function(){
	$("input#username").on('keyup', checkUsername);
	$("input#password").on('keyup', checkPassword);
	$("input#confirmPassword").on('keyup', checkConfirmationPassword);
	$("button#signUp").on('click', checkSignUp);
});

function checkUsername(e) {
	var username = $("input#username").val();
	//if (!/^[0-9a-zA-Z_.- ]+$/.test(username)) {
	//	$("p#usernameError").html('Username contains invalid characters');
	//	return;
	//}
	$.ajax({
        type: 'post',
        url: '/signup/checkUsername',
        data: {'username': username}
    })
    .done(function(data){
    	if (data === 'error') {
    		$("p#usernameError").html('Error');
    		return;
    	}
    	if (data) {
    		$("p#usernameError").html('Username already taken');
    	}
    	else {
    		if (username == '')
    			$("p#usernameError").html("Username can't be empty");
    		else
    			$("p#usernameError").html('');
    	}
    });
}

function checkPassword(e) {
	var password = $("input#password").val();
	var confirmPassword = $("input#confirmPassword").val();
	//if (!/^[0-9a-zA-Z_.- !@#$%^&*?<>,+]+$/.test(username)) {
	//	$("p#passwordError").html('Password contains invalid characters');
	//	return;
	//}
	if (password.length < 8) {
		$("p#passwordError").html('Password must be at least 8 characters long');
		return;
	}
	if (password == '')
		$("p#passwordError").html("Password can't be empty");
	else
		$("p#passwordError").html('');
	if (password != confirmPassword) {
		$("p#passwordConfirmationError").html("Passwords don't match");
		return;
	}
	$("p#passwordConfirmationError").html("");
}

function checkConfirmationPassword(e) {
	var password = $("input#password").val();
	var confirmPassword = $("input#confirmPassword").val();
	if (password != confirmPassword) {
		$("p#passwordConfirmationError").html("Passwords don't match");
		return;
	}
	$("p#passwordConfirmationError").html("");
}

function checkSignUp(e) {
	if ($("p#usernameError").text() != '' || $("p#passwordError").text() != '' || $("p#passwordConfirmationError").text() != '') {
		e.preventDefault();
		return;
	}

	if ($("input#username").val() == '') {
		$("p#usernameError").text("Username can't be empty");
		e.preventDefault();
		return;
	}
	else {
		$("p#usernameError").text('');
	}

	if ($("input#password").val() == '') {
		$("p#passwordError").text("Password can't be empty");
		e.preventDefault();
		return;
	}
	else {
		$("p#passwordError").text('');
	}
}
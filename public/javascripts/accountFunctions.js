$(document).ready(function(){
    $('#sendVerification').on('click', sendVerificationMessage);
    $('#changePassword').on('click', changePassword);
});

function sendVerificationMessage() {
	if (!validateFieldsEmail()) {
		showAlert(false, "Invalid fields");
		return;
	}
	var userData = {
		email: $('#email').val(),
		password: $('#password').val()
	};
	$.ajax({
        type: 'post',
        url: '/user/'+username+'/sendVerificationEmail',
        contentType: 'application/json',
        data: JSON.stringify({userData: userData})
    })
    .done(function(result){
        if (result.err) {
            showAlert(false, result.message);
            return;
        }
        showAlert(true, 'Confirmation message has been sent to your email');
    });
}

function validateFieldsEmail() {
	var email = $('#email').val();
	var password = $('#password').val();
	const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (email.length === 0 || password.length === 0 || !re.test(email.toLowerCase())) {
		return false;
	}
	return true;
}

function showAlert(isSuccess, message) {
    var alert = isSuccess ? '#successAlert' : '#failAlert';
    $(alert).html(message);
    $(alert).show().animate({top: 65}, 500);
    setTimeout(function () {
        $(alert).animate({top: -100}, 500).promise().done(function() {$(alert).hide()})
      }, 3500);
}

function changePassword() {
	if (!validateFieldsPassword()) {
		return;
	}
	var passwordData = {
		new: $('#newPassword').val(),
		old: $('#oldPassword').val()
	};
	$.ajax({
        type: 'post',
        url: '/user/'+username+'/changePassword',
        contentType: 'application/json',
        data: JSON.stringify({passwordData: passwordData})
    })
    .done(function(result){
        if (result.err) {
            showAlert(false, result.message);
            return;
        }
        showAlert(true, 'Password changed');
    });
}

function validateFieldsPassword() {
	var newPassword = $('#newPassword').val();
	var newPasswordConfirm = $('#newPasswordConfirm').val();
	if (!/^[0-9a-zA-Z!@#$%^]+$/.test(newPassword)) {
		showAlert(false, "Password can only contain alphabets, numbers, and !@#$%^");
		return false;
	}
	if (newPassword.length < 8) {
		showAlert(false, "Password must be at least 8 characters long");
		return false;
	}
	if (newPassword == '') {
		showAlert(false, "Password can't be empty");
		return false;
	}
	if (newPassword != newPasswordConfirm) {
		showAlert(false, "Confirmation password doesn't match");
		return false;
	}
	return true;
}
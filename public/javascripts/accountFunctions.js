$(document).ready(function(){
    $('#sendVerification').on('click', sendVerificationMessage);
});

function sendVerificationMessage() {
	if (!validateFields()) {
		showAlert(false, "Imvalid fields");
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

function validateFields() {
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
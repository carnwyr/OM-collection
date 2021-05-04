$(document).ready(function(){
  $('#sendVerification').on('click', sendVerificationMessage);
  $('#changePassword').on('click', changePassword);
});

function sendVerificationMessage() {
  if (!validateFieldsEmail()) {
    showAlert("warning", "Invalid fields");
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
    data: JSON.stringify({userData: userData}),
    cache: false
  })
  .done(function(result){
    if (result.err) {
      showAlert("warning", result.message);
      return;
    }
    showAlert("success", 'Confirmation sent. Please allow a few minutes for the email to arrive!');
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
    data: JSON.stringify({passwordData: passwordData}),
    cache: false
  })
  .done(function(result){
    if (result.err) {
      showAlert("warning", result.message);
      return;
    }
    showAlert("success", 'Password changed');
  });
}

function validateFieldsPassword() {
  var newPassword = $('#newPassword').val();
  var newPasswordConfirm = $('#newPasswordConfirm').val();
  if (!/^[0-9a-zA-Z!@#$%^]+$/.test(newPassword)) {
    showAlert("warning", "Password can only contain alphabets, numbers, and !@#$%^");
    return false;
  }
  if (newPassword.length < 8) {
    showAlert("warning", "Password must be at least 8 characters long");
    return false;
  }
  if (newPassword == '') {
    showAlert("warning", "Password can't be empty");
    return false;
  }
  if (newPassword != newPasswordConfirm) {
    showAlert("warning", "Confirmation password doesn't match");
    return false;
  }
  return true;
}

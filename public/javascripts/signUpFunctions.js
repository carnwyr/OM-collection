const username = document.getElementById("username");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");
const confirmationError = document.getElementById("confirmationError");

$(document).ready(function() {
  $("button#signUp").on("click", checkSignUp);
});

username.onfocusout = function() {
  const regex = /^[0-9a-zA-Z_.-]+$/;

  if (username.value.match(regex)) {
    usernameError.innerHTML = "";
  } else {
    usernameError.innerHTML = "username contains invalid character(s)";
    return;
  }

  $.ajax({
    type: "post",
    url: "/signup/checkUsername",
    data: { username: username }
  }).done(function(data) {
    if (data === "error") {
      usernameError.innerHTML = data;
      return;
    }
    if (data) {
      usernameError.innerHTML = "username taken";
    }
  });
};

password.onkeyup = function() {
  if (password.value.length < 8) {
    passwordError.innerHTML = "Password must contain 8 characters or more";
  } else {
    passwordError.innerHTML = "";
  }
};

confirmPassword.onkeyup = function() {
  if (confirmPassword.value != password.value) {
    confirmationError.innerHTML = "Passwords does not match";
  } else {
    confirmationError.innerHTML = "";
  }
};

function checkSignUp(e) {
  if (
    $("small#usernameError").text() != "" ||
    $("small#passwordError").text() != "" ||
    $("small#passwordConfirmationError").text() != ""
  ) {
    e.preventDefault();
    return;
  }

  if ($("input#username").val() == "") {
    $("small#usernameError").text("Username can't be empty");
    e.preventDefault();
    return;
  } else {
    $("small#usernameError").text("");
  }

  if ($("input#password").val() == "") {
    $("small#passwordError").text("Password can't be empty");
    e.preventDefault();
    return;
  } else {
    $("small#passwordError").text("");
  }
}

var lst = [], nameDict = {};
$(document).ready(function() {
  $("#inputJoinOM").attr("max", new Date().toISOString().split("T")[0])

  $('#sendVerification').on('click', sendVerificationMessage);
  $('#changePassword').on('click', changePassword);
  $("form#profile input[type=submit]").on("click", updateProfile);

  $("#cardSearch input").on("focus", function() {
    if (lst.length == 0) {
      $.ajax({
        type: 'get',
        url: '/getAllCards'
      }).done(function(result) {
        lst = result;
      });
    }
  });
  $("#cardSearch button").on("click", searchCard);
  $(".list-group").on("click", "li", updateDisplayCard);
  $(document).on("click", function(e) {
    var $dropdown = $(".list-group");
    if (!$dropdown.is(e.target) &&  // target isn't .list-group
        !$("#cardSearch button").is(e.target) &&  // target isn't the search button
        $dropdown.has(e.target).length === 0) // target isn't .list-group-item
    {
      $(".list-group").slideUp();
    }
  });

  $("#sortable").sortable();
  $("#sortable").disableSelection();
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
    data: JSON.stringify({userData: userData}),
    cache: false
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
  }, 5000);
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

function updateProfile(e) {
  e.preventDefault();
  var formData = new FormData($("form#profile")[0]);

  var updatedInfo = {};
  var charaList = [];
  for (var pair of formData.entries()) {
    console.log(pair);
  	if (pair[0] !== "characters") {
      updatedInfo[pair[0]] = pair[1];
    } else {
      charaList.push(pair[1]);
    }
  }
  updatedInfo.characters = charaList;

  updatedInfo.display = card;

  $.ajax({
  	type: 'post',
  	url: '/user/' + username + '/updateUserProfile',
  	contentType: 'application/json',
  	data: JSON.stringify({ updatedInfo: updatedInfo }),
  	cache: false
  }).done(function(result) {
  	if (result.err) {
  		showAlert(false, result.message);
  	} else {
      showAlert(true, result.message);
    }
  });
}

function searchCard(e) {
  e.preventDefault();

  var search = $("#cardSearch input").val().replace(/[.*+?^${}()|[\]\\]/g, '');
  var resultList = lst.filter(el => {
    var name = el.name.replace(/[.*+?^${}()|[\]\\]/g, '');
    var reg = new RegExp(search, 'i');
    return reg.test(name);
  }).slice(0, 10);

  $(".list-group").slideUp().empty();
  for (let i = 0; i < resultList.length; i++) {
    nameDict[resultList[i].name] = resultList[i].uniqueName;  // temp solution
    $(".list-group").append(`<li class="list-group-item">${resultList[i].name}</li>`);
  }
  $(".list-group").slideDown();
}

function updateDisplayCard() {
  card = nameDict[$(this).text()];
  $("#cardSearch input").val($(this).text());
  $("#cardSearch img").attr("src",`/images/cards/L/${card}.jpg`);
  $(".list-group").slideUp();
}

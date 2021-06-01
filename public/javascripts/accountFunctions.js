var lst = [], nameDict = {};
$(document).ready(function() {
	$("#inputJoinOM").attr("max", new Date().toISOString().split("T")[0]);

	$("#sendVerification").on("click", sendVerificationMessage);
	$("#changePassword").on("click", changePassword);
	$("input#updateProfile").on("click", updateProfile);

	$("#cardSearch input").on("focus", function() {
		if (lst.length === 0) {
			$.ajax({
				type: "get",
				url: "/getAllCards"
			}).done(function(result) {
				lst = result;
				// console.log(lst);
			});
		}
	});
	$("#cardSearch button").on("click", searchCard);
	$(".list-group").on("click", "li", updateDisplayCard);

	$("#sortable").sortable();
	$("#sortable").disableSelection();
});

$(document).on("click", function(e) {
	/**
	 * Checks that
	 * 1) target isn't .list-group
	 * 2) target isn't anything in the search button
	 * 3) target isn't .list-group-item
	 */
	var $dropdown = $(".list-group");
	if (!$dropdown.is(e.target) && !$("#cardSearch *").is(e.target) && $dropdown.has(e.target).length === 0) {
		$(".list-group").slideUp();
	}
});

function sendVerificationMessage() {
	if (!validateFieldsEmail()) {
		showAlert("danger", "Invalid fields");
		return;
	}
	var userData = {
		email: $("#email").val(),
		password: $("#password").val()
	};
	$.ajax({
		type: "post",
		url: "/user/"+username+"/sendVerificationEmail",
		contentType: "application/json",
		data: JSON.stringify({userData: userData}),
		cache: false
	})
		.done(function(result){
			if (result.err) {
				showAlert("danger", result.message);
				return;
			}
			$("#sendVerification").attr("disabled", "disabled");
			showAlert("success", "Confirmation sent. Please allow a few minutes for the email to arrive!");
			var cooldown = 120;
			var cooldownTimer = setInterval(function() {
				if(cooldown <= 0) {
					clearInterval(cooldownTimer);
					$("#cooldown").text("");
					$("#sendVerification").removeAttr("disabled");
				} else {
					$("#cooldown").text(cooldown + "s left to try again");
				}
				cooldown--;
			}, 1000);
		});
}

function validateFieldsEmail() {
	var email = $("#email").val();
	var password = $("#password").val();
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
		new: $("#newPassword").val(),
		old: $("#oldPassword").val()
	};
	$.ajax({
		type: "post",
		url: "/user/"+username+"/changePassword",
		contentType: "application/json",
		data: JSON.stringify({passwordData: passwordData}),
		cache: false
	})
		.done(function(result){
			if (result.err) {
				showAlert("danger", result.message);
				return;
			}
			showAlert("success", "Password changed");
		});
}

function validateFieldsPassword() {
	var newPassword = $("#newPassword").val();
	var newPasswordConfirm = $("#newPasswordConfirm").val();
	if (!/^[0-9a-zA-Z!@#$%^]+$/.test(newPassword)) {
		showAlert("danger", "Password can only contain alphabets, numbers, and !@#$%^");
		return false;
	}
	if (newPassword.length < 8) {
		showAlert("danger", "Password must be at least 8 characters long");
		return false;
	}
	if (newPassword == "") {
		showAlert("danger", "Password can't be empty");
		return false;
	}
	if (newPassword != newPasswordConfirm) {
		showAlert("danger", "Confirmation password doesn't match");
		return false;
	}
	return true;
}

// needs update for better performance
function updateProfile(e) {
	e.preventDefault();
	var formData = new FormData($("form#profile")[0]);

	var updatedInfo = {};
	var charaList = [];
	for (var pair of formData.entries()) {
		// console.log(pair);
		if (pair[0] !== "characters") {
			updatedInfo[pair[0]] = pair[1];
		} else {
			charaList.push(pair[1]);
		}
	}
	updatedInfo.characters = charaList;
	updatedInfo.display = card;

	$.ajax({
		type: "post",
		url: "/user/" + username + "/updateUserProfile",
		contentType: "application/json",
		data: JSON.stringify({ updatedInfo: updatedInfo }),
		cache: false
	}).done(function(result) {
		if (result.err) {
			showAlert("danger", result.message);
		} else {
			showAlert("success", result.message);
		}
	});
}

function searchCard(e) {
	e.preventDefault();

	var search = $("#cardSearch input").val().replace(/[.*+?^${}()|[\]\\]/g, "");
	var resultList = lst.filter(el => {
		var name = el.name.replace(/[.*+?^${}()|[\]\\]/g, "");
		var reg = new RegExp(search, "i");
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

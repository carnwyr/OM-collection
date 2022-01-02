var lst = [], nameDict = {}, updatedInfo = {};
$(document).ready(function() {
	$("#inputJoinOM").attr("max", new Date().toISOString().split("T")[0]);
	$("#sortable").sortable();
	$("#sortable").disableSelection();

	$("#sendVerification").on("click", sendVerificationMessage);
	$("#changePassword").on("click", changePassword);
	$("input#updateProfile, input#updatePrivacy").on("click", updateProfile);

	$("#cardSearch input").on("focus", function() {
		if (lst.length === 0) {
			$.ajax({
				type: "get",
				url: "/getCards"
			}).done(function(result) {
				if (result.err) {
					showAlert("danger", result.message);
				} else {
					var lang = document.documentElement.lang;
					lst = result.cards.map(card => {
						return {
							name: lang === "ja" ? card.ja_name : card.name,
							uniqueName: card.uniqueName
						}
					});
				}
			});
		}
	});
	$("#cardSearch button").on("click", searchCard);
	$("#cardSearch .list-group").on("click", "li", updateDisplayCard);
	$("form#profile, #v-pills-privacy form").on("change", (event) => {
		updatedInfo[event.target.name] = event.target.value;
	});
	$("#sortable").on("DOMSubtreeModified", () => { updatedInfo["characters"] = true; });
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

$(window).on("beforeunload", () => {
	if (Object.keys(updatedInfo).length !== 0) {
		return confirm("You have unsaved change for your profile. Do you wish to exit without saving?");
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
			showAlert("success", "Confirmation sent!");
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

function updateProfile(e) {
	e.preventDefault();

	if (Object.keys(updatedInfo).length === 0) {
		showAlert("warning", "Your profile is up-to-date :)");
		return;
	}

	// characters need to be specially updated because it's an array
	if (updatedInfo["characters"]) {
		var formData = new FormData($("form#profile")[0]);
		updatedInfo["characters"] = formData.getAll("characters");
	}

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
			updatedInfo = {};
			showAlert("success", result.message);
		}
	});
}

function searchCard(e) {
	e.preventDefault();

	var search = $("#cardSearch input").val().replace(/[.*+?^${}()|[\]\\]/g, "");
	var reg = new RegExp(search, "i");
	var resultList = lst.filter(el => {
		var name = el.name.replace(/[.*+?^${}()|[\]\\]/g, "");
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
	updatedInfo["display"] = card;
	$("#cardSearch input").val($(this).text());
	$("#cardSearch img").attr("src",`/images/cards/L/${card}.jpg`);
	$(".list-group").slideUp();
}

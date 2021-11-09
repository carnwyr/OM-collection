var settings = {};
$(function() {
	recallTab();
	$("#rewards>li>a").click(function() { sessionStorage.setItem("selected", $(this).attr("id")); });

	$("input#stagesCleared").change(() => $("input.custom-range").prop("value", $("input#stagesCleared").prop("value")));
	$("input.custom-range").on("input", () => $("input#stagesCleared").prop("value", $("input.custom-range").prop("value")));

	checkAdditionalSettings();  // check for cookie and apply if cookie exists
	$("button#apply").on("click", applyAdditionalSettings);
});

function startCountdown() {
	var today = new Date();
	var daysLeft = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
	var noun = "day";

	// set to jst midnight if not last day of pop quiz.
	if (daysLeft > 0) {
		endDate.setUTCHours(15);
		noun = "days";
	}

	var x = setInterval(function() {
		var now = new Date();
		var distance = endDate - now;

	  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

	  $("p.countdown").text(`${hours}h ${minutes}m ${seconds}s`);
		$("small.total-countdown").text(`${daysLeft} ${noun} ${hours}:${minutes}:${seconds}`)
	}, 1000);
}

function recallTab() {
	var params = new URLSearchParams(document.location.search.substring(1));
	var custom = params.get("customGoal");
	var selected = sessionStorage.getItem("selected");

	if (custom) { selected = "Custom-tab"; }

	if (selected && $('#'+selected).parent().length !== 0) {
		$('#'+selected).tab("show");
	} else {
		$("#rewards>li:first-child>a").tab("show");
	}
}

function checkAdditionalSettings() {
	var cookie = getCookie("calculator");
	if (cookie) {
		settings = JSON.parse(cookie);
		for (let key in settings) {
			if (key !== "popquiz") {
				$('#'+key).val(settings[key]);
			} else {
				$('#'+key).prop("checked", settings[key]);
			}
		}
	}
}

function applyAdditionalSettings() {
	settings = {
		adBattles: $("#adBattles").val(),
		adAP: $("#adAP").val(),
		fridgeMission: $("#fridgeMission").val(),
		spg: $("#spg").val(),
		friends: $("#friends").val(),
		toDo: $("#toDo").val(),
		other: $("#other").val(),
		popquiz: $("#popquiz").is(":checked")
	};

	document.cookie = `calculator=${JSON.stringify(settings)};expires=${endDate};path=/calculator;`;

	$("#settingsModal").modal("hide");
}

// sourced from w3schools https://www.w3schools.com/js/js_cookies.asp
function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

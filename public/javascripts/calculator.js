$(function() {
	recallTab();
	$("#rewards>li>a").click(function() { sessionStorage.setItem("selected", $(this).attr("id")); });

	$("input#stagesCleared").change(() => $("input.custom-range").prop("value", $("input#stagesCleared").prop("value")));
	$("input.custom-range").on("input", () => $("input#stagesCleared").prop("value", $("input.custom-range").prop("value")));
});

function startCountdown(d) {
	var endDate = new Date(d);
	var today = new Date();
	var daysLeft = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));

	// set to jst midnight if not last day of pop quiz.
	if (daysLeft > 0) {
		endDate.setUTCHours(15);
	}

	var x = setInterval(function() {
		var now = new Date();
		var distance = endDate - now;

	  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

	  $("span.countdown").text(hours + "h " + minutes + "m " + seconds + "s ");
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

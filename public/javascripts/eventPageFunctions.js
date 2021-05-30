$(document).ready(function() {
	$("#currentPoints").on('input', () => updateCalculator());
	$("#pointsPerBattle").on('input', () => updateCalculator());

	updateCalculator();
})

function updateCalculator() {
	var currentPoints = $("#currentPoints").val();
	var pointsPerBattle = $("#pointsPerBattle").val();

	if (!currentPoints || !pointsPerBattle) {
		return;
	}

	$.ajax({
		type: "post",
		url: "/event/" + encodeURIComponent(event.name.replace(/ /g, '_')) + "/calculate",
		contentType: "application/json",
		data: JSON.stringify({ currentPoints: currentPoints, pointsPerBattle: pointsPerBattle })
	}).done(function(data) {
		if (!data.err) {
			updateResults(data.result);
		} else {
			showAlert("danger", "Something went wrong :(");
		}
	});
}

function updateResults(calculationResults) {
	calculationResults.forEach(result => {
		$("#stages_"+result.tag.replace(" ", "")).text("Daily: " + result.dailyStages + " stages");
		$("#total_"+result.tag.replace(" ", "")).text("Total " + result.totalBattles + " battles, " + result.totalAp + " ap");;
	});
}
$(document).ready(function() {
	$("#calculate").click(() => calculate());
})

function calculate() {
	var totalPoints = $("#totalPoints").val();
	var pointsPerBattle = $("#pointsPerBattle").val();
	$.ajax({
			type: "post",
			url: "/event/" + encodeURIComponent(eventName.replace(/ /g, '_')) + "/calculate",
			contentType: "application/json",
			data: JSON.stringify({ totalPoints: totalPoints, pointsPerBattle: pointsPerBattle })
	}).done(function(data) {
		if (!data.err) {
			$('#calculationResult').text(data.result);
			if ($('#calculationResult').hasClass("d-none")) {
				$('#calculationResult').toggleClass("d-none d-block");
			}
		} else {
			showAlert("danger", "Something went wrong :(");
		}
	});
}
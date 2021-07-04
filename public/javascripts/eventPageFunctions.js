$(document).ready(function() {
	$("#currentPoints").on('input', () => updateCalculator());
	$("#pointsPerBattle").on('input', () => updateCalculator());

	updateCalculator();

	$(".card-link").click(e => e.stopPropagation());
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
		var tag = result.tag.replace(" ", "");
		var reward = $("#reward_" + tag);
		var calculationResult = reward.find(".result");
		var details = $("#details_" + tag);
		if (result.collected) {
			reward.removeAttr("role");
			reward.removeAttr("data-toggle");
			details.removeClass("show");

			calculationResult.text("Collected!");
			calculationResult.next().text("");
			calculationResult.parent().next().children().first().hide();
		} else {
			reward.attr("role", "button");
			reward.attr("data-toggle", "collapse");

			var dailyStages = Math.min(Math.floor(result.dailyBattles / 3), event.stages);
			var additionalAttempts = result.dailyBattles - dailyStages * 3;
			var additionalText = getAdditionalBattlesText(additionalAttempts);
				
			calculationResult.text(result.dailyBattles);
			calculationResult.next().text(`(${dailyStages} stages` + additionalText + ")");
			calculationResult.parent().next().children().first().show();

			details.find(".battle-daily").text(result.dailyBattles);
			details.find(".battle-buy").text(result.triesToBuy);
			details.find(".battle-total").text(result.totalBattles);
			
			details.find(".ap-daily").text(result.dailyBattles * 8);
			details.find(".ap-buy").text(result.apToBuy);
			details.find(".ap-total").text(result.totalAp);

			var detailedPoints = details.find(".detailed-points").children();
			var genericRow = detailedPoints.eq(1);
			detailedPoints.eq(0).children().eq(0).text((new Date(result.detailedPoints[0].date)).toLocaleString());
			detailedPoints.eq(0).children().eq(1).text(result.detailedPoints[0].points.toLocaleString());
			var maxLength = Math.max(detailedPoints.length, result.detailedPoints.length);
			for (var i = 1; i < maxLength; i++) {
				if (i >= result.detailedPoints.length) {
					if (i == 1) {
						detailedPoints.eq(i).hide();
					} else {
						detailedPoints.eq(i).remove();
					}
					continue;
				}
				var currentRow;
				if (i >= detailedPoints.length) {
					var newRow = genericRow.clone();
					detailedPoints.parent().append(newRow);
					currentRow = newRow;
				} else {
					currentRow = detailedPoints.eq(i);
				}
				currentRow.find("th").text((new Date(result.detailedPoints[i].date)).toLocaleString());
				currentRow.find("td").text(result.detailedPoints[i].points.toLocaleString());
			}
		}
	});
}

function getAdditionalBattlesText(battles) {
	if (battles === 0) 
		return "";
	
	if (battles === 1)
		return " and 1 battle";
	
	return ` and ${battles} battles`;
}
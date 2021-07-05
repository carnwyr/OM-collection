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
		event.rewards.forEach(reward => {
			var tag     = reward.tag.replace(" ", "");
			var reward  = $("#reward_" + tag);
			var details = $("#details_" + tag);

			if (!reward) {
				return;
			}
				
			disableReward(reward, details, "");
		});
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
		var tag     = result.tag.replace(" ", "");
		var reward  = $("#reward_" + tag);
		var details = $("#details_" + tag);

		if (!reward) {
			return;
		}

		if (result.collected) {
			disableReward(reward, details, "Collected!");
		} else {
			enableReward(reward);
			setMainResult(reward, result.dailyBattles);
			setGeneralDetails(details, result);
			setDailyPoints(details, result);
		}
	});
}

function enableReward(reward) {
	reward.attr("role", "button");
	reward.attr("data-toggle", "collapse");
}

function disableReward(reward, details, text) {
	reward.removeAttr("role");
	reward.removeAttr("data-toggle");
	details.removeClass("show");

	reward.find(".result").text(text);
	reward.find(".result").next().text("");
	reward.find(".result").parent().next().children().first().hide();
}

function setMainResult(reward, dailyBattles) {
	var calculationResult = reward.find(".result");

	var dailyStages = Math.min(Math.floor(dailyBattles / 3), event.stages);
	var additionalAttempts = dailyBattles - dailyStages * 3;
	var additionalText = getAdditionalBattlesText(additionalAttempts);
		
	calculationResult.text(dailyBattles);
	calculationResult.next().text(`(${dailyStages} stages` + additionalText + ")");
	calculationResult.parent().next().children().first().show();
}

function getAdditionalBattlesText(battles) {
	if (battles === 0) 
		return "";
	
	if (battles === 1)
		return " and 1 battle";
	
	return ` and ${battles} battles`;
}

function setGeneralDetails(details, result) {
	details.find(".battle-daily").text(result.dailyBattles);
	details.find(".battle-buy").text(result.triesToBuy);
	details.find(".battle-total").text(result.totalBattles);
	
	details.find(".ap-daily").text(result.dailyBattles * 8);
	details.find(".ap-buy").text(result.apToBuy);
	details.find(".ap-total").text(result.totalAp);
}

function setDailyPoints(details, result) {
	var tableRows = details.find(".detailed-points").children();
	var maxLength = Math.max(tableRows.length, result.pointsPerDay.length);
	
	for (var i = 0; i < maxLength; i++) {
		if (i > result.pointsPerDay.length) {
			tableRows.eq(i).remove();
			continue;
		}
		
		var currentRow;
		if (i >= tableRows.length) {
			var newRow = tableRows.eq(0).clone();
			tableRows.parent().append(newRow);
			currentRow = newRow;
		} else {
			currentRow = tableRows.eq(i);
		}
		currentRow.find("th").text((new Date(result.pointsPerDay[i].date)).toLocaleString());
		currentRow.find("td").text(result.pointsPerDay[i].points.toLocaleString());
	}
}
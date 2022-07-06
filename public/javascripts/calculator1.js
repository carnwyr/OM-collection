$(function() {
	let collapseinfo = localStorage.getItem("#collapseinfo");
	if (collapseinfo === "false") {
		$("#collapseinfo").collapse("show");
	}
	$("a[data-toggle='collapse']").click(function() {
		localStorage.setItem($(this).attr("href"), $(this).attr("aria-expanded"));
	});

	countdown();
	calculate();
	$("form#calculator").on("change", calculate);
});

function resetResult() {
	$(".goaltoday, .dailybattles, .apreq, .freeap, .buyap, .aptot, .freebattles, .buybattles, .battlestot, .apcost, .battlescost, .totcost").text("--");
}

function calculateRemainingFreeAP() {
	return 0;
}

/**
 * Equally divide points among remaining days.
 */
function calculate() {
	let goal = parseInt($("input[name='goal']").val());
	let currentPts = parseInt($("input[name='currpts']").val());
	let ptsPerBattle = parseInt($("input[name='ppb']").val());

	if (isNaN(goal) || isNaN(currentPts) || isNaN(ptsPerBattle) ||
			goal < 0 || currentPts < 0 || ptsPerBattle < 0 ||
			goal <= currentPts) {
		resetResult();
		return;
	}

	// let boostingStart = new Date();
	// let boostingEnd = new Date();
	// let boostingMultiplier = 2;

	let eventEndDate = new Date(END_DATE).getTime();
	let now = new Date().getTime();
	let distance = eventEndDate - now;
	let daysLeft = Math.floor(distance / (1000 * 60 * 60 * 24));

	let pointsTillGoal = goal - currentPts;
	if (pointsTillGoal % ptsPerBattle !== 0) {
		pointsTillGoal += (ptsPerBattle - pointsTillGoal % ptsPerBattle);  // round up to nearest factor of points per battle.
	}

	let totalBattles = pointsTillGoal / ptsPerBattle;

	let dailyPoints = pointsTillGoal / daysLeft;
	let todaysGoal = currentPts + dailyBattles * ptsPerBattle;

	let dailyBattles = Math.ceil(dailyPoints / ptsPerBattle);
	let dailyAP = dailyBattles * 8;

	let freeAP = Math.min(dailyAP, DAILY_FREE_AP);
	let buyAP = dailyAP - freeAP;
	let freeBattles = Math.min(dailyBattles, DAILY_FREE_BATTLES);
	let buyBattles = dailyBattles - freeBattles;
	let apCost = Math.ceil(buyAP / 10);  // 10 ap = 1 dv
	let battlesCost = Math.ceil(buyBattles / 3) * 5;  // 3 battles = 5 dv
	let totalCost = apCost + battlesCost;

	$("#daily .goal").text(todaysGoal);
	$("#daily .dailybattles").text(`${dailyBattles} (${Math.floor(dailyBattles/3)} stages ${dailyBattles%3} battles)`);
	$("#daily .apreq").text((dailyBattles * 8).toLocaleString("en"));

	$("#daily .freeap").text(freeAP.toLocaleString("en"));
	$("#daily .buyap").text(buyAP.toLocaleString("en"));
	$("#daily .aptot").text(dailyAP.toLocaleString("en"));
	$("#daily .freebattles").text(freeBattles.toLocaleString("en"));
	$("#daily .buybattles").text(buyBattles.toLocaleString("en"));
	$("#daily .battlestot").text(dailyBattles.toLocaleString("en"));
	$("#daily .apcost").text(apCost.toLocaleString("en"));
	$("#daily .battlescost").text(battlesCost.toLocaleString("en"));
	$("#daily .totcost").text(totalCost.toLocaleString("en"));

	$("#total .goal").text(currentPts + pointsTillGoal);
	$("#total .dailybattles").text(`${totalBattles} (${Math.floor(totalBattles/3)} stages ${totalBattles%3} battles)`);
	$("#total .apreq").text((totalBattles * 8).toLocaleString("en"));

	let totalAP = totalBattles * 8;
	let totalFreeAP = calculateRemainingFreeAP() + DAILY_FREE_AP * Math.max(daysLeft - 1, 0);
	let totalPaidAP = totalAP - totalFreeAP;
	let totalFreeBattles = Math.max(totalBattles - DAILY_FREE_BATTLES * daysLeft, 0);
	let totalPaidBattles = totalBattles - totalFreeBattles;
	let totalAPCost = Math.ceil(totalPaidAP / 10);
	let totalBattlesCost = Math.ceil(totalPaidBattles / 3) * 5;

	$("#total .freeap").text(totalFreeAP.toLocaleString("en"));
	$("#total .buyap").text(totalPaidAP.toLocaleString("en"));
	$("#total .aptot").text(totalAP.toLocaleString("en"));
	$("#total .freebattles").text(totalFreeBattles.toLocaleString("en"));
	$("#total .buybattles").text(totalPaidBattles.toLocaleString("en"));
	$("#total .battlestot").text(totalBattles.toLocaleString("en"));
	$("#total .apcost").text(totalAPCost.toLocaleString("en"));
	$("#total .battlescost").text(totalBattlesCost.toLocaleString("en"));
	$("#total .totcost").text((totalAPCost + totalBattlesCost).toLocaleString("en"));
}

function countdown() {
	let countDownDate = new Date(END_DATE).getTime();
	let timer = setInterval(function () {
		let now = new Date().getTime();
		let distance = countDownDate - now;
		let days = Math.floor(distance / (1000 * 60 * 60 * 24));
		let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toLocaleString("en-US", { minimumIntegerDigits: 2 });
		let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toLocaleString("en-US", { minimumIntegerDigits: 2 });
		let seconds = Math.floor((distance % (1000 * 60)) / 1000).toLocaleString("en-US", { minimumIntegerDigits: 2 });

		document.getElementById("cd").innerHTML = `${days} days ${hours}:${minutes}:${seconds}`;

		if (distance < 0) {
			clearInterval(timer);
			document.getElementById("cd").innerHTML = "--";
		}
	}, 1000);
}

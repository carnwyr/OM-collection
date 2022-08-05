$(function() {
	let collapseinfo = localStorage.getItem("#collapseinfo");
	if (collapseinfo === "false") {
		$("#collapseinfo").collapse("show");
	}
	$("a[POPQUIZ-toggle='collapse']").click(function() {
		localStorage.setItem($(this).attr("href"), $(this).attr("aria-expanded"));
	});

	countdown(POPQUIZ.end, "cd");
	if (POPQUIZ.hasBoosting && new Date() < POPQUIZ.boostingEnd) {
		if (new Date() < POPQUIZ.boostingStart) {
			countdown(POPQUIZ.boostingStart, "boostingcd");
		} else {
			countdown(POPQUIZ.boostingEnd, "boostingcd");
		}
	}
	calculate();
	$("form#calculator").on("change", calculate);
});

function resetResult() {
	$("#resultTabContent span, #absfree").text('--');
}

function getBattleCost(battles) {
	return Math.ceil(battles / 3) * 5;
}

function getAPCost(ap) {
	return Math.ceil(ap / 10);
}

function remainingFreeAP(daysLeft) {
	let mintuesLeft, fridgeMissionAP = 0;

	if (daysLeft === 0) {
		minutesLeft = (new Date(END_DATE) - new Date()) / 1000 / 60;
	} else {
		let endTime = new Date();
		let timezoneOffset = endTime.getTimezoneOffset() / 60 + 9;
		endTime.setHours(24 - timezoneOffset,0,0,0);
		if (new Date() > endTime) {
			endTime.setDate(endTime.getDate() + 1);
		}
		minutesLeft = (endTime - new Date()) / 1000 / 60;
	}

	if ((new Date()).getHours() < 14) {
		fridgeMissionAP += 60;
	} else if ((new Date()).getHours() < 20) {
		fridgeMissionAP += 30;
	}

	return Math.floor(minutesLeft / 5) + 20 * 2 + 10 * 3 + fridgeMissionAP;
}

/**
 * 1. Find how many "free" points can be obtained.
 * 2. Divide "paid" points among remaining days. (incomplete code)
 */
function calculate() {
	let goal = parseInt($("input[name='goal']").val());
	let currentPts = parseInt($("input[name='currpts']").val());
	let ptsPerBattle = parseInt($("input[name='ppb']").val());

	if (isNaN(goal) || isNaN(currentPts) || isNaN(ptsPerBattle) ||
			goal <= 0 || currentPts < 0 || ptsPerBattle < 0 || goal <= currentPts)
	{
		resetResult();
		return;
	}

	let pointsNeeded = goal - currentPts;

	if (goal % ptsPerBattle !== 0) {
		goal += (ptsPerBattle - pointsNeeded % ptsPerBattle);
	}

	let distance = new Date(POPQUIZ.end).getTime() - new Date().getTime();
	let daysLeft = Math.floor(distance / (1000 * 60 * 60 * 24));

	/* Overview */

	let dailyFreePoints = DAILY_FREE_BATTLES * ptsPerBattle;
	let totalFreePoints = dailyFreePoints * daysLeft + currentPts;

	let additionalPoints = Math.max(pointsNeeded - totalFreePoints, 0);

	$("#freepts").text(totalFreePoints.toLocaleString("en"));
	$("#additionalpts").text(additionalPoints.toLocaleString("en"));
	$("#absfree").text((DAILY_FREE_AP / 8 * ptsPerBattle * daysLeft).toLocaleString("en"));

	let additionalBattles = Math.ceil(additionalPoints / ptsPerBattle);
	let additionalBattlesCost = getBattleCost(additionalBattles);
	let additionalAP = additionalBattles * 8;
	let additionalAPCost = getAPCost(additionalAP);

	$("#overview-regular>li>span.ap").text(`${additionalAP.toLocaleString("en")} (${additionalAPCost.toLocaleString("en")} DP)`);
	$("#overview-regular>li>span.battle").text(`${additionalBattles.toLocaleString("en")} (${additionalBattlesCost.toLocaleString("en")} DP or ${(additionalBattlesCost / 5).toLocaleString("en")} D-Energy)`);

	/* Daily breakdown */

	let todaysGoal = Math.ceil(pointsNeeded / daysLeft);
	let totalBattles = Math.round(todaysGoal / ptsPerBattle);
	let buyBattles = Math.max(totalBattles - DAILY_FREE_BATTLES, 0);
	let freeBattles = totalBattles - buyBattles;
	let battlesCost = getBattleCost(buyBattles);
	let totalAP = totalBattles * 8;
	let freeAP = remainingFreeAP();
	let buyAP = Math.max(totalAP - freeAP, 0);
	let apCost = getAPCost(buyAP);

	$("#goal").text((todaysGoal + currentPts).toLocaleString("en"));
	$("#freeap").text(freeAP.toLocaleString("en"));
	$("#buyap").text(buyAP.toLocaleString("en"));
	$("#aptot").text(totalAP.toLocaleString("en"));
	$("#freebattles").text(freeBattles.toLocaleString("en"));
	$("#buybattles").text(buyBattles.toLocaleString("en"));
	$("#battlestot").text(totalBattles.toLocaleString("en"));
	$("#apcost").text(apCost.toLocaleString("en"));
	$("#battlescost").text(battlesCost.toLocaleString("en"));
	$("#totcost").text((apCost + battlesCost).toLocaleString("en"));
}

function countdown(d, id) {
	let countDownDate = new Date(d).getTime();
	let timer = setInterval(function () {
		let now = new Date().getTime();
		let distance = countDownDate - now;
		let days = Math.floor(distance / (1000 * 60 * 60 * 24));
		let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toLocaleString("en-US", { minimumIntegerDigits: 2 });
		let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toLocaleString("en-US", { minimumIntegerDigits: 2 });
		let seconds = Math.floor((distance % (1000 * 60)) / 1000).toLocaleString("en-US", { minimumIntegerDigits: 2 });

		document.getElementById(id).innerHTML = `${days} days ${hours}:${minutes}:${seconds}`;

		if (distance < 0) {
			clearInterval(timer);
			document.getElementById(id).innerHTML = "--";
		}
	}, 1000);
}

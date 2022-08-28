const utc = "Etc/Greenwich";
const jst = "Asia/Tokyo";

$(function() {
	dayjs().format();
	dayjs.extend(window.dayjs_plugin_utc);
	dayjs.extend(window.dayjs_plugin_timezone);

	if (new Date() < new Date(POPQUIZ.start)) {
		countdown(POPQUIZ.start, "cd");
	} else {
		countdown(POPQUIZ.end, "cd");
	}
	if (POPQUIZ.boostingMultiplier > 1 && new Date() < new Date(POPQUIZ.boostingEnd)) {
		if (new Date() < new Date(POPQUIZ.boostingStart)) {
			countdown(POPQUIZ.boostingStart, "boostingcd");
		} else {
			countdown(POPQUIZ.boostingEnd, "boostingcd");
		}
	}
	calculate();
	$("form#calculator").on("change", calculate);
});

function resetResult() {
	$("#resultTabContent span, #absfree, #goal, .table td").text('--');
}

function getBattleCost(battles) {
	return Math.ceil(battles / 3) * 5;
}

function getAPCost(ap) {
	if (ap === 0) return 0;
	return ap <= 200 ? 10 : Math.ceil((ap - 200) / 10) + 10;
}

function remainingFreeAP(daysLeft) {
	let mintuesLeft, fridgeMissionAP = 0;

	if (daysLeft === 0) {
		minutesLeft = (new Date(POPQUIZ.end) - new Date()) / 1000 / 60;
	} else {
		let endTime = new Date();
		let timezoneOffset = endTime.getTimezoneOffset() / 60 + 9;
		endTime.setHours(24 - timezoneOffset,0,0,0);
		if (new Date() > endTime) {
			endTime.setDate(endTime.getDate() + 1);
		}
		// time left until next refresh
		minutesLeft = (endTime - new Date()) / 1000 / 60;
	}

	if ((new Date()).getHours() < 14) {
		fridgeMissionAP += 60;
	} else if ((new Date()).getHours() < 20) {
		fridgeMissionAP += 30;
	}

	return Math.floor(minutesLeft / 5) + 20 * 2 + 10 * 3 + fridgeMissionAP;
}

function getDaysLeft() {
	let now = dayjs();
	let end = dayjs.tz(POPQUIZ.end, utc);
	let daysLeft = end.diff(now, "day") + 1;
	let jstMidnight = dayjs().tz(jst).set("hour", 0).set("minute", 0).set("second", 0);

	if (now < jstMidnight) { daysLeft++; }  // before daily refresh

	return daysLeft;
}

function getBoostingDaysLeft() {
	if (POPQUIZ.boostingMultiplier == 1) {
		return 0;
	}
	let now = new Date();
	let start = new Date(POPQUIZ.boostingStart);
	let end = new Date(POPQUIZ.boostingEnd);
	if (now > end) return 0;
	if (now > start) {
		start = now;
	}
	return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
}

function calculateTotalGoal(pointsNeeded, ptsPerBattle, currentPts, daysLeft) {
	let freeBoostingPoints = 120 * (POPQUIZ.boostingMultiplier - 1) * DAILY_FREE_BATTLES * getBoostingDaysLeft();
	let basePoints = DAILY_FREE_BATTLES * ptsPerBattle * daysLeft;

	let totalFreePoints = currentPts + basePoints + freeBoostingPoints;
	let purchasedPoints = Math.max(currentPts + pointsNeeded - totalFreePoints, 0);

	$("#freepts").text(totalFreePoints.toLocaleString("en"));
	$(".additionalpts").text(purchasedPoints.toLocaleString("en"));

	let absFreeBattles = Math.floor(DAILY_FREE_AP / 8);
	$("#absfree").text((currentPts + absFreeBattles * ptsPerBattle * daysLeft + absFreeBattles * 120 * (POPQUIZ.boostingMultiplier - 1) * getBoostingDaysLeft()).toLocaleString("en"));

	// NOTE: might need to rethink logic
	if (pointsNeeded > basePoints) {
		pointsNeeded = Math.max(pointsNeeded - freeBoostingPoints, 0);
	}
	let totalBattles = Math.ceil(pointsNeeded / ptsPerBattle);
	let freeBattles = Math.min(DAILY_FREE_BATTLES * daysLeft, totalBattles);
	let buyBattles = totalBattles - freeBattles;
	let totalBattlesCost = getBattleCost(buyBattles);

	let totalAP = totalBattles * 8;
	let freeAP = Math.min(DAILY_FREE_AP * daysLeft, totalAP);
	let buyAP = totalAP - freeAP;
	let totalAPCost = getAPCost(buyAP / daysLeft) * daysLeft;

	$("#total-freeap").text(freeAP.toLocaleString("en"));
	$("#total-buyap").text(buyAP.toLocaleString("en"));
	$("#total-ap").text(totalAP.toLocaleString("en"));
	$("#total-freebattles").text(freeBattles.toLocaleString("en"));
	$("#total-buybattles").text(buyBattles.toLocaleString("en"));
	$("#total-battles").text(totalBattles.toLocaleString("en"));
	$("#total-ap-cost").text(totalAPCost.toLocaleString("en"));
	$("#total-battle-cost").text(totalBattlesCost.toLocaleString("en"));
	$("#total-dp").text((totalAPCost + totalBattlesCost).toLocaleString("en"));

	// console.log((totalBattlesCost / 5).toLocaleString("en") + " D-Energy");  // put this somewhere on page

	calculateAdditional(buyBattles, purchasedPoints, ptsPerBattle);
}

function calculateDailyGoal(pointsNeeded, ptsPerBattle, currentPts, daysLeft) {
	let todaysGoal = Math.max(Math.ceil(pointsNeeded / daysLeft), ptsPerBattle);
	let totalBattles = Math.round(todaysGoal / ptsPerBattle);
	let buyBattles = Math.max(totalBattles - DAILY_FREE_BATTLES, 0);
	let freeBattles = totalBattles - buyBattles;
	let battlesCost = getBattleCost(buyBattles);
	let totalAP = totalBattles * 8;
	let freeAP = Math.min(DAILY_FREE_AP, totalAP);
	let buyAP = totalAP - freeAP;
	let apCost = getAPCost(buyAP);

	$("#goal").text((todaysGoal + currentPts).toLocaleString("en"));
	$("#freeap").text(freeAP.toLocaleString("en"));
	$("#buyap").text(buyAP.toLocaleString("en"));
	$("#total-daily-ap").text(totalAP.toLocaleString("en"));
	$("#freebattles").text(freeBattles.toLocaleString("en"));
	$("#buybattles").text(buyBattles.toLocaleString("en"));
	$("#total-daily-battles").text(totalBattles.toLocaleString("en"));
	$("#apcost").text(apCost.toLocaleString("en"));
	$("#battlescost").text(battlesCost.toLocaleString("en"));
	$("#total-daily-cost").text((apCost + battlesCost).toLocaleString("en"));
}

function calculateAdditional(buyBattles, additionalPoints, ptsPerBattle) {
	let battlesCost = getBattleCost(buyBattles);
	let totalAP = buyBattles * 8;
	$("#ap-non-boosting").html(`${totalAP.toLocaleString("en")}<br>for ${Math.ceil(totalAP / 10).toLocaleString("en")} DP`);
	$("#battles-non-boosting").html(`${buyBattles.toLocaleString("en")}<br>for ${battlesCost.toLocaleString("en")} DP (${Math.ceil(battlesCost / 5).toLocaleString("en")} D-Energy)`);

	let multiplier = POPQUIZ.boostingMultiplier;
	ptsPerBattle += 120 * (multiplier - 1);

	let totalBattles = Math.ceil(additionalPoints / ptsPerBattle);
	battlesCost = getBattleCost(totalBattles);
	totalAP = totalBattles * 8;

	$("#ap-boosting").html(`${totalAP.toLocaleString("en")}<br>for ${Math.ceil(totalAP / 10).toLocaleString("en")} DP`);
	$("#battles-boosting").html(`${totalBattles.toLocaleString("en")}<br>for ${battlesCost.toLocaleString("en")} DP (${Math.ceil(battlesCost / 5).toLocaleString("en")} D-Energy)`);
}

/**
 * 1. Find how many "free" points can be obtained.
 * 2. Divide "paid" points among remaining days.
 */
// TODO: clean up functions; reuse variables.
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

	let daysLeft = getDaysLeft();

	calculateTotalGoal(pointsNeeded, ptsPerBattle, currentPts, daysLeft);
	calculateDailyGoal(pointsNeeded, ptsPerBattle, currentPts, daysLeft);
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

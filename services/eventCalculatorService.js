const async = require("async");

const eventsService = require("../services/eventsService");
const dayjs         = require('dayjs');
const utc           = require('dayjs/plugin/utc');
const timezone      = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// TODO fridge based on user's time
const baseApPerDay = 20 + 50 + 20 + 50;  // guests + ads + to do + friends
const baseFridgeAp = 2 * 30;
const vipFridgeAp = 2 * 60;

const apPerStage = 8;
const minutesToRestoreAp = 5;

exports.calculate = function (event, input) {
	var parsedInput = parseInput(input, event);
	if (!parsedInput) {
		return ["Invalid input", null];
	}

	return [null, getCalculationResult(event, parsedInput)];
}

function getCalculationResult(event, input) {
	var { pointsPerBattle, currentPoints, customGoal, stagesCleared } = input;
	var isVip = false;

	var rewards = event.rewards.slice().sort();
	if (customGoal) {
		rewards.push({tag: "Custom", points: customGoal});
	}

	let startTime = dayjs.utc(event.start).tz("Asia/Tokyo");
	var endTime     = dayjs.utc(event.end).tz("Asia/Tokyo");
	var endDate     = endTime.startOf("day");
	var currentTime = dayjs().tz("Asia/Tokyo");
	var currentDate = currentTime.startOf("day");
	var daysLeft    = endDate.diff(currentDate, "day");
	var resetTime = currentTime.add(1, "day").startOf("day");
	
	let eventLength = endTime.diff(startTime, "day");

	var availableTriesDaily = 3 * event.stages + 5;

	rewards = rewards.filter(reward => reward.points)
		.map(reward => {
			if (reward.points <= currentPoints) {
				return { tag: reward.tag, collected: true };
			}

			var pointsNeeded = reward.points - currentPoints;
			var triesNeeded  = Math.ceil(pointsNeeded / pointsPerBattle);
			var apNeeded     = triesNeeded * 8;

			var triesLeftToday = (event.stages - stagesCleared) * 3 + (event.stages === stagesCleared ? 0 : 5); // if all stages cleared, ads are assumed to be watched
			var triesLeftFree = availableTriesDaily * daysLeft + triesLeftToday;

			var currentPage = Math.floor(currentPoints / event.pageCost);
			var finalPage   = Math.floor(reward.points / event.pageCost) - (reward.points % event.pageCost === 0 ? 1 : 0);
			var apRewarded  = 0;
			for (var i = currentPage; i <= finalPage; i++) {
				event.ap
					.filter(ap => !ap.page || ap.page === i + 1)
					.map(ap => { ap.points += i * event.pageCost; return ap; })
					.filter(ap => ap.points > currentPoints && ap.points < reward.points)
					.forEach(ap => apRewarded += ap.amount);
			}

			let [battlesFreeBase, battlesPaidBase] = calculateBase(eventLength, pointsPerBattle, reward.points, availableTriesDaily);

			let battlesFree = Math.min(triesNeeded, triesLeftFree);
			let battlesPaid = triesNeeded - battlesFree;
			let battlesTotal = battlesFree + battlesPaid;

			let battlesPaidExpected = battlesPaidBase * (daysLeft + 1);
			let battlesDelta = battlesPaidExpected - battlesPaid;
			let battlesPaidToday, battlesPaidDaily;
			if (battlesDelta >= 0) {
				battlesPaidDaily = Math.ceil(battlesPaid / daysLeft);
				if (battlesPaidDaily <= battlesPaidBase) {
					battlesPaidToday = 0;
				} else {
					battlesPaidDaily = battlesPaidBase;
					battlesPaidToday = battlesPaid - battlesPaidDaily * daysLeft;
				}
			} else {
				let averageBattles = Math.ceil(battlesPaid / (daysLeft + 1));
				battlesPaidToday = averageBattles;
				battlesPaidDaily = averageBattles;
			}

			let battlesFreeToday = Math.min(triesLeftToday, battlesFree / (daysLeft + 1));
			let battlesFreeDaily = Math.ceil((battlesFree - battlesFreeToday) / daysLeft);

			let battlesToday = battlesFreeToday + battlesPaidToday;

			let apTotal = battlesTotal * apPerStage;

			let apToday = battlesToday * apPerStage;
			let apFreeToday = Math.min(getRegeneratedAp(currentTime, resetTime) + getDailyAp(isVip), apToday);
			let apPaidToday = apToday - apFreeToday;

			let apFreeTotal = getRegeneratedAp(currentTime, endTime) + apRewarded + getDailyAp(isVip) * (daysLeft + 1);
			let apPaidTotal = Math.max(apTotal - apFreeTotal, 0);
			
			var goalToday = currentPoints + battlesToday * pointsPerBattle;

			return {
				tag: reward.tag,
				battles: {
					today: {
						free: battlesFreeToday,
						buy: battlesPaidToday,
						total: battlesToday
					},
					total: {
						free: battlesFree,
						buy: battlesPaid,
						total: battlesTotal
					}
				},
				ap: {
					today: {
						free: apFreeToday,
						buy: apPaidToday,
						total: apToday
					},
					total: {
						free: apFreeTotal,
						buy: apPaidTotal,
						total: apTotal
					}
				},

				dailyBattles: battlesFreeDaily + battlesPaidDaily,
				dailyAp: (battlesFreeDaily + battlesPaidDaily) * apPerStage,
				goalToday: goalToday
			};
	});

	return rewards;
}

function getDailyAp(isVip) {
	return baseApPerDay + (isVip ? vipFridgeAp : baseFridgeAp)
}

function parseInput(data, event) {
	pointsPerBattle = parseInt(data.pointsPerBattle);
	if (!pointsPerBattle || pointsPerBattle < 120) return null;

	var currentPoints = parseInt(data.currentPoints);
	if (isNaN(currentPoints) || currentPoints < 0 || currentPoints > 20000000) return null;

	var customGoal = parseInt(data.customGoal);
	if (customGoal > 20000000) return null;

	var stagesCleared = parseInt(data.stagesCleared);
	if (isNaN(stagesCleared) || stagesCleared < 0 || stagesCleared > event.stages) return null;

	return {pointsPerBattle: pointsPerBattle, currentPoints: currentPoints, customGoal: customGoal, stagesCleared: stagesCleared};
}

function calculateBase(eventLength, pointsPerBattle, rewardCost, freeTriesPerDay) {
	let dailyPoints = Math.ceil(rewardCost / eventLength);
	let dailyBattles = Math.ceil(dailyPoints / pointsPerBattle);

	let dailyBattlesFree = Math.min(dailyBattles, freeTriesPerDay);
	let dailyBattlesPaid = dailyBattles - dailyBattlesFree;
	
	return [dailyBattlesFree, dailyBattlesPaid];
}

function getRegeneratedAp(startTime, endTime) {
	let minutes = endTime.diff(startTime, "minute");
	return Math.floor(minutes / minutesToRestoreAp);
}

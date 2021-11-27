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

	var endTime     = dayjs.utc(event.end).tz("Asia/Tokyo");
	var endDate     = endTime.startOf("day");
	var currentTime = dayjs().tz("Asia/Tokyo");
	var currentDate = currentTime.startOf("day");
	var daysLeft    = endDate.diff(currentDate, "day");
	var resetTime   = currentTime.add(1, "day").startOf("day");

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

			var apRegen = Math.floor(endTime.diff(currentTime, "minute") / 5);

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

			var dailyBattlesTotal = Math.ceil(triesNeeded / (daysLeft + 1));
			var dailyBattlesToBuy = Math.max(dailyBattlesTotal - availableTriesDaily, 0);

			var todayBattlesOverflow = Math.max(dailyBattlesTotal - dailyBattlesToBuy - triesLeftFree, 0);
			var todayBattlesTotal = dailyBattlesTotal - todayBattlesOverflow;
			dailyBattlesTotal = Math.ceil((triesNeeded - todayBattlesTotal) / daysLeft);

			var totalApFree = apRegen + apRewarded + getDailyAp(isVip) * (daysLeft + 1);
			var totalApToBuy = Math.max(apNeeded - totalApFree, 0);
			var todayApTotal = todayBattlesTotal * 8;
			var todayApFree = Math.floor(resetTime.diff(currentTime, "minute") / 5) + getDailyAp(isVip);
			var todayApToBuy = todayApTotal - todayApFree;

			var todayApOverflow = Math.ceil(Math.max(todayApToBuy - totalApToBuy, 0) / 8);
			todayBattlesTotal = todayBattlesTotal - todayApOverflow;
			dailyBattlesTotal = Math.ceil((triesNeeded - todayBattlesTotal) / daysLeft);
			dailyBattlesToBuy = Math.max(dailyBattlesTotal - availableTriesDaily, 0);
			todayApTotal = todayBattlesTotal * 8;
			todayApToBuy = todayApTotal - todayApFree;

			var todayBattlesFree = Math.min(triesLeftToday, todayBattlesTotal);
			var todayBattlesToBuy = todayBattlesTotal - todayBattlesFree;

			var totalBattlesToBuy = Math.max(triesNeeded - triesLeftFree, 0);
			var totalBattlesFree = Math.min(triesNeeded, triesLeftFree);
			var totalBattlesTotal = totalBattlesToBuy + totalBattlesFree;

			todayApFree = Math.min(todayApFree, todayApTotal);
			todayApToBuy = todayApTotal - todayApFree;

			totalApFree = Math.min(totalApFree, apNeeded);

			var goalToday = currentPoints + todayBattlesTotal * pointsPerBattle;

			return {
				tag: reward.tag,
				battles: {
					today: {
						free: todayBattlesFree,
						buy: todayBattlesToBuy,
						total: todayBattlesTotal
					},
					total: {
						free: totalBattlesFree,
						buy: totalBattlesToBuy,
						total: totalBattlesTotal
					}
				},
				ap: {
					today: {
						free: todayApFree,
						buy: todayApToBuy,
						total: todayApTotal
					},
					total: {
						free: totalApFree,
						buy: totalApToBuy,
						total: apNeeded
					}
				},

				dailyBattles: dailyBattlesTotal,
				dailyAp: (dailyBattlesTotal) * 8,
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

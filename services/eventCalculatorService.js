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

	var rewards = event.rewards.sort();
	if (customGoal) {
		rewards.push({tag: "Custom", points: customGoal});
	}

	var endTime     = dayjs(event.end).tz("Asia/Tokyo");
	var endDate     = endTime.startOf("day");
	var currentTime = dayjs().tz("Asia/Tokyo");
	var currentDate = currentTime.startOf("day");
	var daysLeft    = endDate.diff(currentDate, "day");

	rewards = rewards.filter(reward => reward.points)
		.map(reward => {
			if (reward.points <= currentPoints) {
				return { tag: reward.tag, collected: true };
			}

			var pointsNeeded = reward.points - currentPoints;
			var triesNeeded  = Math.ceil(pointsNeeded / pointsPerBattle);
			var apNeeded     = triesNeeded * 8;

			var triesLeftToday = (event.stages - stagesCleared) * 3 + (event.stages === stagesCleared ? 0 : 5); // if all stages cleared, ads are assumed to be watched
			var triesLeftMin = (3 * event.stages + 5) * (daysLeft - 1) + triesLeftToday;

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

			var apMin        = apRegen + apRewarded + getDailyAp(isVip) * daysLeft;
			var dailyBattles = Math.ceil(triesNeeded / daysLeft);
			var triesToBuy   = Math.max(triesNeeded - triesLeftMin, 0);

			// TODO
			var goalToday = currentPoints;

			return { tag: reward.tag, triesToBuy: triesToBuy, dailyBattles: dailyBattles, apToBuy: Math.max(apNeeded - apMin, 0), totalBattles: triesNeeded, totalAp: apNeeded, goalToday: goalToday };
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
	if (isNaN(customGoal)) customGoal = 0;
	if (customGoal > 20000000) return null;
	
	var stagesCleared = parseInt(data.stagesCleared);
	if (isNaN(stagesCleared) || stagesCleared < 0 || stagesCleared > event.stages) return null;
	
	return {pointsPerBattle: pointsPerBattle, currentPoints: currentPoints, customGoal: customGoal, stagesCleared: stagesCleared};
}
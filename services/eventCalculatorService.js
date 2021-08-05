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
const vipFridgeAp  = 2 * 60;

exports.calculate = function (event, input) {
	// TODO:
	var currentPoints = input.currentPoints, pointsPerBattle = input.pointsPerBattle, isVip = false;


	var rewards = event.rewards.sort();

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

			var triesLeftMin = (3 * event.stages + 5) * daysLeft;

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

			var pointsPerDay = [];
			var nextReset = currentTime.add(1, "day").startOf("day");
			for (var time = nextReset, dayPoints = Number(currentPoints); time < endTime; time = time.add(1, 'day'), dayPoints += dailyBattles * pointsPerBattle) {
				pointsPerDay.push({ date: time.toString(), points: dayPoints });
			}
			pointsPerDay.push({ date: endTime.toString(), points: Number(currentPoints) + triesNeeded * pointsPerBattle });

			return { tag: reward.tag, triesToBuy: triesToBuy, dailyBattles: dailyBattles, apToBuy: Math.max(apNeeded - apMin, 0), totalBattles: triesNeeded, totalAp: apNeeded, pointsPerDay: pointsPerDay };
	});

	return rewards;
}

function getDailyAp(isVip) {
	return baseApPerDay + (isVip ? vipFridgeAp : baseFridgeAp)
}

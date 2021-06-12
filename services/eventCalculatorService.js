const async = require("async");

const eventsService = require("../services/eventsService");

const apPerDay = 20 + 50 + 60 + 20 + 50; // guests + ads + fridge + to do + friends

exports.calculate = function (event, currentPoints, pointsPerBattle) {
	var rewards = event.rewards.sort();

	var endTime     = new Date(event.end);
	var endDate     = new Date(endTime).setUTCHours(0, 0, 0, 0);
	var currentTime = new Date();
	var currentDate = new Date(currentTime).setUTCHours(0, 0, 0, 0);
	var daysLeft    = Math.round((endDate - currentDate) / (24 * 60 * 60 * 1000)) - 1;

	rewards = rewards.map(reward => {
		if (reward.points <= currentPoints) {
			return { tag: reward.tag, collected: true };
		}

		let pointsNeeded = reward.points - currentPoints;
		let triesNeeded  = Math.ceil(pointsNeeded / pointsPerBattle);
		let apNeeded     = triesNeeded * 8;

		let triesLeftMin = (3 * event.stages + 5) * daysLeft;

		let apRegen = Math.floor((endTime.getTime() - currentTime.getTime()) / (60 * 1000) / 5);

		let currentPage = Math.floor(currentPoints / event.pageCost);
		let finalPage   = Math.floor(reward.points / event.pageCost) - (reward.points % event.pageCost === 0 ? 1 : 0);
		let apRewarded  = 0;
		for (var i = currentPage; i <= finalPage; i++) {
			event.ap
				.filter(ap => !ap.page || ap.page === i + 1)
				.map(ap => { ap.points += i * event.pageCost; return ap; })
				.filter(ap => ap.points > currentPoints && ap.points < reward.points)
				.forEach(ap => apRewarded += ap.amount);
		}

		let apMin = apRegen + apRewarded * + apPerDay * daysLeft;

		if (triesNeeded > triesLeftMin) {
			var triesToBuy = triesNeeded - triesLeftMin;
		} else {
			var dailyStages = Math.ceil(Math.ceil(triesNeeded / daysLeft) / 3);
		}

		return { tag: reward.tag, triesToBuy: triesToBuy, dailyStages: dailyStages, apToBuy: apNeeded - apMin, totalBattles: triesNeeded, totalAp: apNeeded };
	});

	return rewards;
}
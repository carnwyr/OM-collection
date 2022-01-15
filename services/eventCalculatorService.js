const async = require("async");

const eventService = require("../services/eventService");
const dayjs         = require('dayjs');
const utc           = require('dayjs/plugin/utc');
const timezone      = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// TODO fridge based on user's time
const adAPCount = 5;
const adAPAmount = 10;
const defaultFridgeConf = { isVip: false, count: 2 };
const fridgeVipAP = 60;
const fridgeNormalAP = 30;
const spgAPCount = 2;
const spgAPAmount = 10;
const friendsAPAmount = 50;
const toDoAPAmount = 20;
const defaultAdBattles = 5;


exports.calculate = function (event, input) {
	var parsedInput = parseInput(input, event);
	if (!parsedInput) {
		return ["Invalid input", null];
	}

	setDefaultAdvancedSettings(parsedInput.advancedSettings);

	return [null, getCalculationResult(event, parsedInput)];
}

function getCalculationResult(event, input) {
	var { pointsPerBattle, currentPoints, customGoal, stagesCleared, advancedSettings } = input;

	var apDaily = getDailyAp(advancedSettings);
	var apOther = advancedSettings.other;

	var rewards = event.rewards.slice().sort();
	if (customGoal) {
		rewards.push({tag: "Custom", points: customGoal});
	}

	var endTime     = dayjs(event.end).tz("Asia/Tokyo");
	var endDate     = endTime.startOf("day");
	var currentTime = dayjs().tz("Asia/Tokyo");
	var currentDate = currentTime.startOf("day");
	var daysLeft    = endDate.diff(currentDate, "day");
	var resetTime   = currentTime.add(1, "day").startOf("day");

	var availableTriesDaily = 3 * event.stages + advancedSettings.adBattles;

	rewards = rewards.filter(reward => reward.points)
		.map(reward => {
			if (reward.points <= currentPoints) {
				return { tag: reward.tag, collected: true };
			}

			var pointsNeeded = reward.points - currentPoints;
			var triesNeeded  = Math.ceil(pointsNeeded / pointsPerBattle);
			var apNeeded     = triesNeeded * 8;

			var triesLeftToday = (event.stages - stagesCleared) * 3 + (event.stages === stagesCleared ? 0 : advancedSettings.adBattles); // if all stages cleared, ads are assumed to be watched
			var triesLeftMin = availableTriesDaily * (daysLeft - 1) + triesLeftToday + advancedSettings.denergy * 3;

			var apRegen = Math.floor(endTime.diff(currentTime, "minute") / 5);

			var currentPage = Math.floor(currentPoints / event.pageCost);
			var finalPage   = Math.floor(reward.points / event.pageCost) - (reward.points % event.pageCost === 0 ? 1 : 0);
			var apRewarded = 0;
			
			if (advancedSettings.popquiz) {
				for (var i = currentPage; i <= finalPage; i++) {
					event.ap
						.filter(ap => !ap.page || ap.page === i + 1)
						.map(ap => { ap.points += i * event.pageCost; return ap; })
						.filter(ap => ap.points > currentPoints && ap.points < reward.points)
						.forEach(ap => apRewarded += ap.amount);
				}
			}

			var totalApFree = Math.min(apRegen + apRewarded + apDaily * daysLeft + apOther, apNeeded);

			var totalBattlesToBuy = Math.max(triesNeeded - triesLeftMin, 0);
			var dailyBattlesFree  = totalBattlesToBuy > 0 ? availableTriesDaily : Math.ceil(triesNeeded / daysLeft);
			var todayBattlesFree  = Math.min(triesLeftToday, triesNeeded, dailyBattlesFree);
				dailyBattlesFree = totalBattlesToBuy > 0 ? availableTriesDaily :
					daysLeft == 1 ? 0 : Math.ceil((triesNeeded - todayBattlesFree) / (daysLeft - 1));
			var dailyBattlesToBuy = Math.ceil(totalBattlesToBuy / daysLeft);
			var todayBattlesTotal = todayBattlesFree + dailyBattlesToBuy;

			var todayApTotal = todayBattlesTotal * 8;
			var todayApFree = Math.min(Math.floor(resetTime.diff(currentTime, "minute") / 5) + apDaily + apOther, todayApTotal);

			var totalBattlesFree = todayBattlesFree + dailyBattlesFree * (daysLeft - 1);
			var totalBattlesTotal = totalBattlesFree + totalBattlesToBuy;

			var goalToday = currentPoints + todayBattlesTotal * pointsPerBattle;

			return {
				tag: reward.tag,
				battles: {
					today: {
						free: todayBattlesFree,
						buy: dailyBattlesToBuy,
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
						buy: todayApTotal - todayApFree,
						total: todayApTotal
					},
					total: {
						free: totalApFree,
						buy: apNeeded - totalApFree,
						total: apNeeded
					}
				},

				dailyBattles: dailyBattlesFree + dailyBattlesToBuy,
				dailyAp: (dailyBattlesFree + dailyBattlesToBuy) * 8,
				goalToday: goalToday
			};
	});

	return rewards;
}

function getDailyAp(advancedSettings) {
	return advancedSettings.adAP + advancedSettings.fridgeMission + advancedSettings.spg + advancedSettings.friends + advancedSettings.toDo;
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

	return {pointsPerBattle: pointsPerBattle, currentPoints: currentPoints, customGoal: customGoal, stagesCleared: stagesCleared, advancedSettings: data.advanced};
}

function setDefaultAdvancedSettings(settings) {
	settings.adBattles = "adBattles" in settings ? settings.adBattles : defaultAdBattles;
	settings.denergy = "denergy" in settings ? settings.denergy : 0;
	settings.adAP = ("adAP" in settings ? settings.adAP : adAPCount) * adAPAmount;
	var fridgeConf = "fridgeMission" in settings ? settings.fridgeMission : defaultFridgeConf;
	settings.fridgeMission = (fridgeConf.isVip ? fridgeVipAP : fridgeNormalAP) * fridgeConf.count;
	settings.spg = ("spg" in settings ? settings.spg : spgAPCount) * spgAPAmount;
	settings.friends = "friends" in settings ? settings.friends : friendsAPAmount;
	settings.toDo = "toDo" in settings ? settings.toDo : toDoAPAmount;
	settings.other = "other" in settings ? settings.other : 0;
	settings.popquiz = "popquiz" in settings ? settings.popquiz : true;
}
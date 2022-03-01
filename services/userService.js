const Sentry = require('@sentry/node');
const i18next = require("i18next");
const ObjectId = require("mongodb").ObjectID;

const suggestionService = require("../services/suggestionService");
const Users = require("../models/users.js");

exports.getUser = async function (username) {
  var usernameRegexp = new RegExp('^' + username + '$', "i");
  try {
    var user = await Users.findOne({ "info.name": { $regex: usernameRegexp } });
    return user;
  } catch (e) {
		console.error(e.message);
    Sentry.captureException(e);
	}
};

exports.getOwnedCards = async function (username) {
  return await getCardCollection(username, "owned");
}

exports.getFaveCards = async function (username) {
  return await getCardCollection(username, "faved");
}

getCardCollection = function (username, collection) {
  try {
    return Users.aggregate([
      { $match: { "info.name": username } },
      { $unwind: `$cards.${collection}` },
      { $lookup: {
        from: "cards",
        localField: `cards.${collection}`,
        foreignField: "uniqueName",
        as: "cardData"
      }},
      { $unwind: "$cardData" },
      { $replaceWith: "$cardData"},
      { $sort: { number : -1 } }
    ]);
  } catch (e) {
    console.error(e.message);
    Sentry.captureException(e);
  }
};

exports.getProfileInfo = async function(username) {
  try {
    var user = await exports.getUser(username);
    var info = { ...user.profile };

    if (i18next.t("lang") === "en") {
      info.joinKarasu = `${new Intl.DateTimeFormat("en", { month: "long" }).format(ObjectId(user._id).getTimestamp())} ${ObjectId(user._id).getTimestamp().getFullYear()}`;
    } else {
      info.joinKarasu = `${ObjectId(user._id).getTimestamp().getFullYear()}年${ObjectId(user._id).getTimestamp().getMonth() + 1}月`;
    }

    if (info.joined) {
      var date = info.joined.getUTCDate(),
          month = info.joined.getUTCMonth() + 1,
          year = info.joined.getUTCFullYear();
      if (i18next.t("lang") === "en") {
        info.joined = `${date} ${new Intl.DateTimeFormat("en", { month: "long" }).format(info.joined)} ${year}`;
      } else {
        info.joined = `${year}年${month}月${date}日`;
      }
    }

    info.badges = sortObjArrayByKey(user.info.supportStatus, "name");
    info.karasu_name = user.info.name;

    return info;
  } catch (e) {
    console.error(e)
    Sentry.captureException(e);
    return {};
  }
}

function sortObjArrayByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key], y = b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}

exports.ownsCard = function(user, card) {
	return Users.exists({"info.name": user, "cards.owned": card});
};

exports.favesCard = function(username, card) {
	return Users.exists({"info.name": username, "cards.faved": card});
};

exports.getNumberOfUsers = function() {
	return Users.estimatedDocumentCount();
};

exports.renameCardInCollections = function(oldName, newName) {
	if (oldName === newName) {
		return Promise.resolve(true);
	}

	var promiseFaved = Users.updateMany(
		{ $or: [{ "cards.owned": oldName }, { "cards.faved": oldName }]},
		{ $push: { "cards.owned": newName, "cards.faved": newName }});
	var promiseOwned = Users.updateMany(
		{ },
		{ $pull: { "cards.owned": oldName, "cards.faved": oldName }});

	return promiseFaved.then(() => { return promiseOwned; });
};

exports.deleteCardInCollections = function(cardName) {
	var promise = Users.updateMany(
		{ },
		{ $pull: { "cards.owned": cardName, "cards.faved": cardName }});

	return promise;
};

exports.updateSupport = async function(user, status) {
  try {
    let result = await Users.updateOne({ "info.name": user }, { $set: { "info.supportStatus": status }});
    if (result.n !== 1 || result.nModified !== 1) throw "Something went wrong!"
    return { err: null, message: "Status updated!"}
  } catch(e) {
    return { err: true, message: e.message };
  }
};

exports.banUser = async function(name) {
  try {
    let banResult = await Users.findOneAndUpdate({ "info.name": name }, { $push: { "info.supportStatus": { 'name': 'bannedFromMakingSuggestions' } }});
    let deleteSuggestionResult = await suggestionService.refuseSuggestionsFrom({ user: name });
    if (banResult.err || deleteSuggestionResult.err) throw "Something went wrong.";
    return { err: null, message: "User banned."};
  } catch(e) {
    return { err: true, message: e.message };
  }
};

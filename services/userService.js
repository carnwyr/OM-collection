const Sentry = require('@sentry/node');
const ObjectId = require("mongodb").ObjectID;

const suggestionService = require("../services/suggestionService");
const Users = require("../models/users.js");
const { updateSupport } = require('../controllers/userController');

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

exports.getAccountData = async function (username) {
  var usernameRegexp = new RegExp('^' + username + '$', "i");
  var user = await Users.aggregate([
    { $match: { "info.name": { $regex: usernameRegexp } } },
    {
      $project: {
        name: "$info.name",
        email: "$info.email",
        profile: "$profile",
        _id: false
      }
    }
  ]);
  return user[0];
};

exports.getOwnedCards = async function (username) {
  return await getCardCollection(username, "owned");
}

exports.getFaveCards = async function (username) {
  return await getCardCollection(username, "faved");
}

getCardCollection = function (username, collectionType) {
  try {
    return Users.aggregate([
      { $match: { "info.name": username } },
      { $unwind: `$cards.${collectionType}` },
      { $lookup: {
        from: "cards",
        localField: `cards.${collectionType}`,
        foreignField: "uniqueName",
        as: "cardData"
      }},
      { $sort: { "cardData.number": -1 } },
      { $limit: 15 },
      { $project: { name: "$cardData.name", uniqueName: `$cards.${collectionType}`, _id: false } },
      { $unwind: "$name" }
    ]);
  } catch (e) {
    console.error(e.message);
    Sentry.captureException(e);
  }
};

exports.getOwnedCardsStats = async function (username) {
  let collectionType = "owned";
  try {
    return (await Users.aggregate([
      { $match: { "info.name": username } },
      { $unwind: `$cards.${collectionType}` },
      { $lookup: {
        from: "cards",
        localField: `cards.${collectionType}`,
        foreignField: "uniqueName",
        as: "cardData"
      }},
      { $unwind: "$cardData" },
      { $replaceWith: "$cardData" },
      { $facet: {
				characters: [
					{ $unwind: "$characters"},
					{ $group: { _id: "$characters", count: { $sum: 1 } } },
					{ $project: { k: "$_id", v: "$count", _id: false } }
				],
				rarity: [
					{ $group: { _id: "$rarity", count: { $sum: 1 } } },
					{ $project: { k: "$_id", v: "$count", _id: false } }],
				attribute: [
					{ $group: { _id: "$attribute", count: { $sum: 1 } } },
					{ $project: { k: "$_id", v: "$count", _id: false } }],
				cards: [
					{ $group: { _id: "$type", count: { $sum: 1 } } },
					{ $project: { k: "$_id", v: "$count", _id: false } }]
			}},
			{ $project: {
				characters: { $arrayToObject: "$characters" },
				rarity: { $arrayToObject: "$rarity" },
				attribute: { $arrayToObject: "$attribute" },
				cards: { $arrayToObject: "$cards" },
			}}
    ]))[0];
  } catch (e) {
    console.error(e.message);
    Sentry.captureException(e);
  }
}

exports.getProfileInfo = async function(username, language) {
  try {
    var user = await exports.getUser(username);
    var info = { ...user.profile };

    if (language === "en") {
      info.joinKarasu = `${new Intl.DateTimeFormat("en", { month: "long" }).format(ObjectId(user._id).getTimestamp())} ${ObjectId(user._id).getTimestamp().getFullYear()}`;
    } else {
      info.joinKarasu = `${ObjectId(user._id).getTimestamp().getFullYear()}年${ObjectId(user._id).getTimestamp().getMonth() + 1}月`;
    }

    if (info.joined) {
      var date = info.joined.getUTCDate(),
          month = info.joined.getUTCMonth() + 1,
          year = info.joined.getUTCFullYear();
      if (language === "en") {
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

exports.getUserTreeStats = async function(username) {
  try {
    let user = await Users.findOne({ "info.name": username });
    if (!user.tree || user.tree.length === 0) {
      return [];
    }

    // { _id: item name, count: amount unlocked }
    return await Users.aggregate([
      {
        '$match': {
          'info.name': username
        }
      }, {
        '$project': {
          'tree': 1
        }
      }, {
        '$unwind': {
          'path': '$tree',
          'preserveNullAndEmptyArrays': false
        }
      }, {
        '$lookup': {
          'from': 'cards',
          'let': {
            'tree_id': '$tree'
          },
          'pipeline': [
            {
              '$project': {
                'dt': 1
              }
            }, {
              '$unwind': {
                'path': '$dt',
                'preserveNullAndEmptyArrays': false
              }
            }, {
              '$replaceRoot': {
                'newRoot': {
                  '$mergeObjects': [
                    '$dt'
                  ]
                }
              }
            }, {
              '$match': {
                '$expr': {
                  '$eq': [
                    '$_id', '$$tree_id'
                  ]
                }
              }
            }
          ],
          'as': 'item'
        }
      }, {
        '$unwind': {
          'path': '$item',
          'preserveNullAndEmptyArrays': false
        }
      }, {
        '$group': {
          '_id': '$item.reward',
          'count': {
            '$count': {}
          }
        }
      }
    ]);
  } catch(e) {
    console.error(e);
    Sentry.captureException(e);
    return [];
  }
};

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
  let result = await Users.updateOne({ "info.name": user }, { $set: { "info.supportStatus": status } });
  if (!result.ok) {
    return { err: true, message: "Something went wrong!" };
  }
  return { err: false, message: "Status updated!"}
};

exports.banUser = async function (name) {
  let banResult = await Users.findOneAndUpdate({ "info.name": name }, { $push: { "info.supportStatus": { 'name': 'bannedFromMakingSuggestions' } }});
  let deleteSuggestionResult = await suggestionService.refuseSuggestionsFrom(name);
  if (!banResult.ok || !deleteSuggestionResult.ok) {
    return { err: true, message: "Something went wrong!" };
  }
  return { err: false, message: "User banned"};
};

exports.updateUserTree = async function(username, node, isUnlocked) {
  if (isUnlocked && isUnlocked == "true") {
    await Users.findOneAndUpdate({ "info.name": username }, { $addToSet: { tree: new ObjectId(node) } });
  } else {
    await Users.findOneAndUpdate({ "info.name": username }, { $pull: { tree: new ObjectId(node) } });
  }
};

const Sentry = require('@sentry/node');
const createError = require("http-errors");

// TODO: fix structure
const Users = require("../models/users.js");

const userService = require("../services/userService");
const cardService = require("../services/cardService");
const suggestionService = require("../services/suggestionService");
const revisionService = require("../services/revisionService");


exports.getAccountPage = async function (req, res, next) {
  var user = await userService.getAccountData(req.user.name);
  if (!user) {
    return next(createError(404, properties = { title: "User not found" }));
  }
  return res.render("account", { user: user });
};

exports.updateSupport = async function(req, res) {
  let user = req.body.user;
  let newstatus = JSON.parse(req.body.newstatus);
  return res.json(await userService.updateSupport(user, newstatus));
};

// TODO test
exports.banUser = async function (req, res) {
  return res.json(await userService.banUser(req.body.name));
}

// TODO test
exports.getOwnedUniqueNames = async function (req, res, next) {
  return res.json(await userService.getOwnedUniqueNames(req.user.name));
}

// TODO safeguard from adding fake card names
// TODO test error
exports.submitCollectionChanges = async function(req, res, next) {
  let result = await userService.modifyCollection(req.user.name, req.body.collection, req.body.changedCards);

  if (result.err) {
    return next(createError(result.err.message, properties= {title: "Something went wrong. Try refreshing the page"}));
  }

  return res.json(result);
};

exports.submitCardStatusChange = async function (req, res) {
  let changedCards = {};
  changedCards[req.params.card] = req.body.modify === "add";

  let result = await userService.modifyCollection(req.user.name, req.body.collection, changedCards);

  if (result.err) {
    return next(createError(result.err.message, properties= {title: "Something went wrong. Try refreshing the page"}));
  }

  result.updatedVal = await getUpdatedCount(req.params.card, req.body.collection);

  return res.json(result);
};

async function getUpdatedCount(card, collection) {
  let updatedVal = collection == "owned" ? await userService.getOwnedCardCount(card) : await userService.getFavedCardCount(card);
  let totalusers = await userService.getNumberOfUsers();
  return (updatedVal / totalusers * 100).toFixed(2);
};

exports.getUserListPage = async function(req, res) {
  let page = req.query.page ?? 1;
  let limit = 50;

  let startIndex = (page - 1) * limit;

  let result = {};
  result.users = await userService.getUserList(req.query.sortby, req.query.order, limit, startIndex);
  result.totalUsers = await userService.getNumberOfUsers();
  result.totalPages = Math.ceil(result.totalUsers / limit);
  result.nextPage = page < result.totalPages ? page + 1 : 0;
  result.previousPage = page > 1 ? page - 1 : 0;

  res.render('userpage', { userList: result, user: req.user});
};

exports.getRankingsPage = async function(req, res, next) {
  try {
    var cards = await Users.aggregate([
      { $unwind: "$cards.faved" },
      { $group: { _id: "$cards.faved", total: { $sum: 1 } } },
      { $sort: { total: -1, _id: 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "cards",
          localField: "_id",
          foreignField: "uniqueName",
          as: "cardData"
        }
      },
      { $addFields: { name: { $arrayElemAt: ["$cardData", 0] } } },
      { $set: { name: "$name.name", ja_name: "$name.ja_name" } },
      { $unset: ["cardData"] }
    ]);
    return res.render("rankings", { title: req.i18n.t("common.rankings"), description: "Ranking of most liked obey me cards.", ranking: cards, user: req.user });
  } catch (e) {
    return next(e);
  }
};

exports.getTreeProgressPage = async function(req, res, next) {
  try {
    let totalTreeStats = await cardService.getTotalTreeStats();
    let userTreeStats = await userService.getUserTreeStats(req.user.name);

    return res.render("user/treeProgress", {
      title: "My tree progress",
      description: "My tree progress on Karasu-OS.com",
      stats: { total: totalTreeStats, user: userTreeStats },
      user: req.user
    });
  } catch(e) {
    Sentry.captureException(e);
    return next(e);
  }
};

exports.getUserSuggestionPage = async function(req, res, next) {
  try {
    let suggestions = await suggestionService.getSuggestionList({ user: req.user.name });
    let revisions = await revisionService.getRevisions({ user: req.user.name });
    return res.render("user/suggestions", {
      title: "My edits",
      description: "My edits on karasu-os.com",
      suggestions: suggestions,
      count: suggestions.length + revisions.length,
      user: req.user
    });
  } catch(e) {
    Sentry.captureException(e);
    return next(e);
  }
};

exports.updateUserProfile = function(req, res) {
  var update = {};
  for (const field in req.body.updatedInfo) {
    update[`profile.${field}`] = req.body.updatedInfo[field];
  }

  Users.updateOne(
    { "info.name": req.user.name },
    { $set: update },
    function(err, result) {
      if (err) {
        Sentry.captureException(err);
        return res.json({ err: true, message: "Something went wrong :(" });
      }

      if (result.nModified === 1) {
        return res.json({ err: null, message: "Updated!" });
      } else {
        return res.json({ err: true, message: "Something went wrong :(" });
      }
    }
  );
}

exports.updateUserTree = async function(req, res) {
  try {
    await userService.updateUserTree(req.user.name, req.body.node, req.body.isUnlocked);
    return res.json({ err: null, message: "Saved!" });
  } catch(e) {
    Sentry.captureException(e);
    return res.json({ err: true, message: e.message });
  }
};

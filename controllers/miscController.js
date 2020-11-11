exports.privacyPolicy = function(req, res, next) {
  res.render('policies', { title: 'Privacy Policy', user: req.user });
};

// exports.surpriseGuest = function(req, res, next) {
//   res.render('surpriseGuest', { title: 'Surprise Guest', description: "Obey Me! surprise guest information | Karasu-OS.com", user: req.user });
// };

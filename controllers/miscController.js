exports.privacyPolicy = function(req, res, next) {
  res.render('policies', { title: 'Privacy Policy', user: req.user });
};
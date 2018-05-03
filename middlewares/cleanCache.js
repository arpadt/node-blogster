const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
  await next(); // let the route handler do its stuff THEN come back to this middleware

  clearHash(req.user.id);
}

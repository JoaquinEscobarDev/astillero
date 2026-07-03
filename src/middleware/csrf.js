const { doubleCsrf } = require('csrf-csrf');
const env = require('../config/env');

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.csrfSecret,
  cookieName: 'astillero.csrf',
  cookieOptions: {
    sameSite: 'strict',
    secure: env.cookiesSeguras,
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.body && req.body._csrf,
});

function inyectarTokenCsrf(req, res, next) {
  res.locals.csrfToken = generateToken(req, res);
  next();
}

module.exports = { doubleCsrfProtection, inyectarTokenCsrf };

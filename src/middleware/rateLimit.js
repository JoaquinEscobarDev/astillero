const rateLimit = require('express-rate-limit');

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos de ingreso. Espera unos minutos y vuelve a intentar.',
});

module.exports = { limitadorLogin };

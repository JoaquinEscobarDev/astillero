const helmet = require('helmet');
const env = require('../config/env');

const directivas = {
  defaultSrc: ["'self'"],
  imgSrc: ["'self'", 'data:'],
  styleSrc: ["'self'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  scriptSrc: ["'self'"],
  connectSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  baseUri: ["'self'"],
};

// upgrade-insecure-requests obliga al navegador a usar HTTPS incluso para enlaces
// http://; solo tiene sentido cuando el sitio realmente corre detras de HTTPS
// (produccion). En desarrollo local (http plano) rompe la navegacion. Helmet lo
// activa por defecto, asi que hay que desactivarlo explicitamente con null.
if (!env.cookiesSeguras) {
  directivas.upgradeInsecureRequests = null;
}

const seguridadHeaders = helmet({
  contentSecurityPolicy: { directives: directivas },
  crossOriginEmbedderPolicy: false,
  // HSTS le dice al navegador que recuerde usar siempre HTTPS con este dominio;
  // solo corresponde cuando el sitio realmente corre detras de HTTPS (produccion).
  strictTransportSecurity: env.cookiesSeguras,
});

module.exports = seguridadHeaders;

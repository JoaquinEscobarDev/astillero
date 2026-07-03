const path = require('path');
require('dotenv').config();

function requerido(nombre, porDefecto) {
  const valor = process.env[nombre];
  if (valor === undefined || valor === '') {
    if (porDefecto !== undefined) return porDefecto;
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa el archivo .env`);
  }
  return valor;
}

const raiz = path.resolve(__dirname, '..', '..');

module.exports = {
  raiz,
  puerto: parseInt(requerido('PORT', '3000'), 10),
  sessionSecret: requerido('SESSION_SECRET'),
  csrfSecret: requerido('CSRF_SECRET'),
  archivoBaseDeDatos: path.resolve(raiz, requerido('DATABASE_FILE', './data/astillero.sqlite')),
  maxFotoBytes: parseInt(requerido('MAX_FOTO_MB', '40'), 10) * 1024 * 1024,
  cookiesSeguras: requerido('COOKIES_SEGURAS', 'false') === 'true',
  rutas: {
    original: path.join(raiz, 'storage', 'original'),
    thumb: path.join(raiz, 'storage', 'thumb'),
    web: path.join(raiz, 'storage', 'web'),
  },
};

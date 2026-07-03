const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const env = require('./src/config/env');
require('./src/config/db');
const AlmacenSesionesSqlite = require('./src/config/sessionStore');

const seguridadHeaders = require('./src/middleware/seguridadHeaders');
const { inyectarTokenCsrf } = require('./src/middleware/csrf');

const authRoutes = require('./src/routes/auth');
const pageRoutes = require('./src/routes/pages');
const carpetaRoutes = require('./src/routes/carpetas');
const fotoRoutes = require('./src/routes/fotos');
const mediaRoutes = require('./src/routes/media');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(seguridadHeaders);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    store: new AlmacenSesionesSqlite(),
    name: 'astillero.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.cookiesSeguras,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
);

app.use(inyectarTokenCsrf);

app.use((req, res, next) => {
  res.locals.estaAutenticado = Boolean(req.session && req.session.usuarioId);
  res.locals.nombreUsuarioSesion = (req.session && req.session.nombreUsuario) || '';
  next();
});

app.use(mediaRoutes);
app.use(authRoutes);
app.use(pageRoutes);
app.use(carpetaRoutes);
app.use(fotoRoutes);

app.use((req, res) => {
  res.status(404).render('no-encontrado', { titulo: 'No encontrado' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.code === 'EBADCSRFTOKEN') {
    if (req.session) req.session.mensajeError = 'La pagina se quedo abierta mucho tiempo. Intenta de nuevo.';
    return res.redirect(req.get('Referer') || '/');
  }
  res.status(500).render('error', { titulo: 'Algo salio mal' });
});

app.listen(env.puerto, () => {
  console.log(`El Astillero corriendo en http://localhost:${env.puerto}`);
});

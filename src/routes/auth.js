const express = require('express');
const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');
const { redirigirSiYaHaIngresado } = require('../middleware/auth');
const { limitadorLogin } = require('../middleware/rateLimit');
const { doubleCsrfProtection } = require('../middleware/csrf');

const router = express.Router();

router.get('/ingresar', redirigirSiYaHaIngresado, (req, res) => {
  const mensajeError = req.session.mensajeError;
  req.session.mensajeError = null;
  res.render('login', { titulo: 'Ingresar', mensajeError });
});

router.post('/ingresar', limitadorLogin, doubleCsrfProtection, redirigirSiYaHaIngresado, async (req, res) => {
  const usuario = (req.body.usuario || '').trim().toLowerCase();
  const password = req.body.password || '';

  const fila = usuarioModel.buscarPorUsuario(usuario);

  const mensajeGenerico = 'Usuario o contraseña incorrectos. Intenta de nuevo.';

  if (!fila) {
    return res.render('login', { titulo: 'Ingresar', mensajeError: mensajeGenerico });
  }

  if (usuarioModel.estaBloqueado(fila)) {
    return res.render('login', {
      titulo: 'Ingresar',
      mensajeError: `Esta cuenta se bloqueo temporalmente por muchos intentos fallidos. Espera ${usuarioModel.MINUTOS_BLOQUEO} minutos e intenta de nuevo.`,
    });
  }

  const coincide = await bcrypt.compare(password, fila.hash_password);

  if (!coincide) {
    usuarioModel.registrarIntentoFallido(fila.id);
    return res.render('login', { titulo: 'Ingresar', mensajeError: mensajeGenerico });
  }

  usuarioModel.limpiarIntentos(fila.id);

  req.session.regenerate((err) => {
    if (err) {
      return res.render('login', {
        titulo: 'Ingresar',
        mensajeError: 'No se pudo iniciar sesion. Intenta de nuevo.',
      });
    }
    req.session.usuarioId = fila.id;
    req.session.nombreUsuario = fila.nombre;
    req.session.rol = fila.rol;
    res.redirect('/');
  });
});

router.post('/salir', doubleCsrfProtection, (req, res) => {
  req.session.destroy(() => {
    res.redirect('/ingresar');
  });
});

module.exports = router;

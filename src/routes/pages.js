const express = require('express');
const { requiereSesion } = require('../middleware/auth');
const carpetaModel = require('../models/carpetaModel');
const fotoModel = require('../models/fotoModel');

const router = express.Router();

router.use(requiereSesion);

function tomarMensajes(req) {
  const mensajeError = req.session.mensajeError || null;
  const mensajeExito = req.session.mensajeExito || null;
  req.session.mensajeError = null;
  req.session.mensajeExito = null;
  return { mensajeError, mensajeExito };
}

router.get('/', (req, res) => {
  const carpetas = carpetaModel.listarTodas();
  res.render('inicio', {
    titulo: 'El Astillero',
    carpetas,
    ...tomarMensajes(req),
  });
});

router.get('/carpetas/:id', (req, res) => {
  const carpeta = carpetaModel.buscarPorId(req.params.id);
  if (!carpeta) {
    req.session.mensajeError = 'Esa carpeta ya no existe.';
    return res.redirect('/');
  }
  const fotos = fotoModel.listarPorCarpeta(carpeta.id);
  res.render('carpeta', {
    titulo: carpeta.nombre,
    carpeta,
    fotos,
    ...tomarMensajes(req),
  });
});

router.get('/fotos/:id', (req, res) => {
  const foto = fotoModel.buscarPorId(req.params.id);
  if (!foto) {
    req.session.mensajeError = 'Esa foto ya no existe.';
    return res.redirect('/');
  }
  const carpeta = carpetaModel.buscarPorId(foto.carpeta_id);
  res.render('foto', {
    titulo: 'Foto',
    foto,
    carpeta,
    ...tomarMensajes(req),
  });
});

module.exports = router;

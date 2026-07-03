const express = require('express');
const { requiereSesion } = require('../middleware/auth');
const { doubleCsrfProtection } = require('../middleware/csrf');
const carpetaModel = require('../models/carpetaModel');
const fotoModel = require('../models/fotoModel');
const { eliminarArchivosDeFoto } = require('../services/imageService');

const router = express.Router();

router.use(requiereSesion);

router.post('/carpetas', doubleCsrfProtection, (req, res) => {
  const nombre = (req.body.nombre || '').trim();
  if (!nombre) {
    req.session.mensajeError = 'Escribe un nombre para la carpeta antes de crearla.';
    return res.redirect('/');
  }
  const carpeta = carpetaModel.crear({ usuarioId: req.session.usuarioId, nombre });
  req.session.mensajeExito = `Carpeta "${carpeta.nombre}" creada.`;
  res.redirect('/');
});

router.get('/carpetas/:id/renombrar', (req, res) => {
  const carpeta = carpetaModel.buscarPorId(req.params.id);
  if (!carpeta) {
    req.session.mensajeError = 'Esa carpeta ya no existe.';
    return res.redirect('/');
  }
  res.render('renombrar-carpeta', { titulo: 'Cambiar nombre', carpeta });
});

router.post('/carpetas/:id/renombrar', doubleCsrfProtection, (req, res) => {
  const carpeta = carpetaModel.buscarPorId(req.params.id);
  if (!carpeta) {
    req.session.mensajeError = 'Esa carpeta ya no existe.';
    return res.redirect('/');
  }
  const nuevoNombre = (req.body.nombre || '').trim();
  if (!nuevoNombre) {
    req.session.mensajeError = 'Escribe un nombre valido.';
    return res.redirect(`/carpetas/${carpeta.id}/renombrar`);
  }
  carpetaModel.renombrar(carpeta.id, nuevoNombre);
  req.session.mensajeExito = 'Nombre de la carpeta actualizado.';
  res.redirect(`/carpetas/${carpeta.id}`);
});

router.get('/carpetas/:id/eliminar', (req, res) => {
  const carpeta = carpetaModel.buscarPorId(req.params.id);
  if (!carpeta) {
    req.session.mensajeError = 'Esa carpeta ya no existe.';
    return res.redirect('/');
  }
  res.render('confirmar-eliminar-carpeta', { titulo: 'Borrar carpeta', carpeta });
});

router.post('/carpetas/:id/eliminar', doubleCsrfProtection, async (req, res) => {
  const carpeta = carpetaModel.buscarPorId(req.params.id);
  if (carpeta) {
    const fotos = fotoModel.listarPorCarpeta(carpeta.id);
    await Promise.all(fotos.map((foto) => eliminarArchivosDeFoto(foto)));
    carpetaModel.eliminar(carpeta.id);
    req.session.mensajeExito = `La carpeta "${carpeta.nombre}" fue borrada.`;
  }
  res.redirect('/');
});

module.exports = router;

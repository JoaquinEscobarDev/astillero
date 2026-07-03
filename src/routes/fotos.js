const express = require('express');
const { requiereSesion } = require('../middleware/auth');
const { upload, manejarErrorDeSubida } = require('../middleware/upload');
const { doubleCsrfProtection } = require('../middleware/csrf');
const carpetaModel = require('../models/carpetaModel');
const fotoModel = require('../models/fotoModel');
const { procesarYGuardarFoto, eliminarArchivosDeFoto, FotoInvalidaError } = require('../services/imageService');

const router = express.Router();

router.use(requiereSesion);

router.post(
  '/carpetas/:id/fotos',
  (req, res, next) => {
    upload.array('fotos', 20)(req, res, (err) => {
      if (err) return manejarErrorDeSubida(err, req, res, next);
      next();
    });
  },
  doubleCsrfProtection,
  async (req, res) => {
    const carpeta = carpetaModel.buscarPorId(req.params.id);
    if (!carpeta) {
      req.session.mensajeError = 'Esa carpeta ya no existe.';
      return res.redirect('/');
    }

    const archivos = req.files || [];
    if (archivos.length === 0) {
      req.session.mensajeError = 'No se selecciono ninguna foto para subir.';
      return res.redirect(`/carpetas/${carpeta.id}`);
    }

    let subidas = 0;
    let ultimoError = null;

    for (const archivo of archivos) {
      try {
        const resultado = await procesarYGuardarFoto(archivo.buffer);
        fotoModel.crear({
          carpetaId: carpeta.id,
          nombreArchivo: resultado.nombreArchivo,
          rutaOriginal: resultado.rutaOriginal,
          rutaThumbnail: resultado.rutaThumbnail,
          rutaWeb: resultado.rutaWeb,
          descripcion: '',
        });
        subidas += 1;
      } catch (error) {
        if (error instanceof FotoInvalidaError) {
          ultimoError = error.mensajeParaElUsuario;
        } else {
          ultimoError = 'Una de las fotos no se pudo procesar. Intenta de nuevo.';
        }
      }
    }

    if (subidas > 0) {
      req.session.mensajeExito =
        subidas === 1 ? 'Se subio 1 foto.' : `Se subieron ${subidas} fotos.`;
    }
    if (ultimoError) {
      req.session.mensajeError = ultimoError;
    }

    res.redirect(`/carpetas/${carpeta.id}`);
  }
);

router.get('/fotos/:id/editar', (req, res) => {
  const foto = fotoModel.buscarPorId(req.params.id);
  if (!foto) {
    req.session.mensajeError = 'Esa foto ya no existe.';
    return res.redirect('/');
  }
  res.render('editar-foto', { titulo: 'Editar descripcion', foto });
});

router.post('/fotos/:id/editar', doubleCsrfProtection, (req, res) => {
  const foto = fotoModel.buscarPorId(req.params.id);
  if (!foto) {
    req.session.mensajeError = 'Esa foto ya no existe.';
    return res.redirect('/');
  }
  fotoModel.actualizarDescripcion(foto.id, (req.body.descripcion || '').trim());
  req.session.mensajeExito = 'Descripcion guardada.';
  res.redirect(`/fotos/${foto.id}`);
});

router.get('/fotos/:id/eliminar', (req, res) => {
  const foto = fotoModel.buscarPorId(req.params.id);
  if (!foto) {
    req.session.mensajeError = 'Esa foto ya no existe.';
    return res.redirect('/');
  }
  res.render('confirmar-eliminar-foto', { titulo: 'Borrar foto', foto });
});

router.post('/fotos/:id/eliminar', doubleCsrfProtection, async (req, res) => {
  const foto = fotoModel.buscarPorId(req.params.id);
  if (foto) {
    await eliminarArchivosDeFoto(foto);
    fotoModel.eliminar(foto.id);
    req.session.mensajeExito = 'La foto fue borrada.';
    return res.redirect(`/carpetas/${foto.carpeta_id}`);
  }
  res.redirect('/');
});

module.exports = router;

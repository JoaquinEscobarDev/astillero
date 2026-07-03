const multer = require('multer');
const env = require('../config/env');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFotoBytes,
    files: 20,
  },
});

function manejarErrorDeSubida(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.session.mensajeError =
        'Esa foto es muy grande. ¿Puedes comprimirla o tomar la foto con menor calidad e intentar de nuevo?';
      return res.redirect('back');
    }
    req.session.mensajeError = 'Hubo un problema al subir la foto. Intenta de nuevo.';
    return res.redirect('back');
  }
  return next(err);
}

module.exports = { upload, manejarErrorDeSubida };

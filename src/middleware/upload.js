const os = require('os');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');

const MAX_ARCHIVOS_POR_SUBIDA = 20;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, `astillero-subida-${crypto.randomBytes(16).toString('hex')}`),
});

const upload = multer({
  storage,
  limits: {
    fileSize: Math.max(env.maxFotoBytes, env.maxVideoBytes),
    files: MAX_ARCHIVOS_POR_SUBIDA,
  },
});

function manejarErrorDeSubida(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.session.mensajeError = `Ese archivo es muy grande (máximo ${env.maxFotoMB} MB para fotos, ${env.maxVideoMB} MB para videos). ¿Puedes comprimirlo o intentar con uno más liviano?`;
      return res.redirect('back');
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      req.session.mensajeError = `Puedes subir hasta ${MAX_ARCHIVOS_POR_SUBIDA} archivos a la vez. Elige menos archivos e inténtalo de nuevo (puedes hacerlo en varias tandas).`;
      return res.redirect('back');
    }
    req.session.mensajeError = 'Hubo un problema al subir el archivo. Intenta de nuevo.';
    return res.redirect('back');
  }
  return next(err);
}

module.exports = { upload, manejarErrorDeSubida, MAX_ARCHIVOS_POR_SUBIDA };

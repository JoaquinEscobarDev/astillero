const os = require('os');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, `astillero-subida-${crypto.randomBytes(16).toString('hex')}`),
});

const upload = multer({
  storage,
  limits: {
    fileSize: Math.max(env.maxFotoBytes, env.maxVideoBytes),
    files: 20,
  },
});

function manejarErrorDeSubida(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.session.mensajeError = `Ese archivo es muy grande (máximo ${env.maxFotoMB} MB para fotos, ${env.maxVideoMB} MB para videos). ¿Puedes comprimirlo o intentar con uno más liviano?`;
      return res.redirect('back');
    }
    req.session.mensajeError = 'Hubo un problema al subir el archivo. Intenta de nuevo.';
    return res.redirect('back');
  }
  return next(err);
}

module.exports = { upload, manejarErrorDeSubida };

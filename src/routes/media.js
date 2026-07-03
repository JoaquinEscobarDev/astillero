const express = require('express');
const path = require('path');
const { requiereSesion } = require('../middleware/auth');
const env = require('../config/env');

const router = express.Router();

const CARPETAS_POR_TIPO = {
  thumb: env.rutas.thumb,
  web: env.rutas.web,
  original: env.rutas.original,
};

router.get('/media/:tipo/:archivo', requiereSesion, (req, res) => {
  const carpeta = CARPETAS_POR_TIPO[req.params.tipo];
  if (!carpeta) {
    return res.status(404).end();
  }

  const nombreSeguro = path.basename(req.params.archivo);
  const rutaCompleta = path.join(carpeta, nombreSeguro);

  if (!rutaCompleta.startsWith(carpeta)) {
    return res.status(400).end();
  }

  res.sendFile(rutaCompleta, (err) => {
    if (err && !res.headersSent) {
      res.status(404).end();
    }
  });
});

module.exports = router;

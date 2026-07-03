const crypto = require('crypto');
const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');
const fileType = require('file-type');
const env = require('../config/env');

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);

class FotoInvalidaError extends Error {
  constructor(mensajeParaElUsuario) {
    super(mensajeParaElUsuario);
    this.mensajeParaElUsuario = mensajeParaElUsuario;
  }
}

function generarIdentificadorAleatorio() {
  return `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
}

async function procesarYGuardarFoto(bufferOriginal) {
  const tipo = fileType(bufferOriginal);

  if (!tipo || !TIPOS_PERMITIDOS.has(tipo.mime)) {
    throw new FotoInvalidaError(
      'Ese archivo no se puede usar como foto. Por favor sube una imagen en formato JPG, PNG o WEBP (si tu celular guarda fotos en formato HEIC, cambia la camara a modo "Mas compatible" antes de tomar la foto).'
    );
  }

  let metadata;
  try {
    metadata = await sharp(bufferOriginal).metadata();
  } catch (error) {
    throw new FotoInvalidaError(
      'No se pudo abrir esa imagen. Puede estar dañada. Intenta con otra foto.'
    );
  }

  const id = generarIdentificadorAleatorio();
  const nombreOriginal = `${id}.${tipo.ext}`;
  const nombreThumb = `thumb-${id}.jpg`;
  const nombreWeb = `web-${id}.jpg`;

  await fs.writeFile(path.join(env.rutas.original, nombreOriginal), bufferOriginal);

  await sharp(bufferOriginal)
    .rotate()
    .resize({ width: 400, height: 400, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 75 })
    .toFile(path.join(env.rutas.thumb, nombreThumb));

  await sharp(bufferOriginal)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(path.join(env.rutas.web, nombreWeb));

  return {
    nombreArchivo: id,
    rutaOriginal: nombreOriginal,
    rutaThumbnail: nombreThumb,
    rutaWeb: nombreWeb,
    ancho: metadata.width,
    alto: metadata.height,
  };
}

async function eliminarArchivosDeFoto(foto) {
  const rutas = [
    path.join(env.rutas.original, foto.ruta_original),
    path.join(env.rutas.thumb, foto.ruta_thumbnail),
    path.join(env.rutas.web, foto.ruta_web),
  ];
  await Promise.all(
    rutas.map((ruta) => fs.unlink(ruta).catch(() => {}))
  );
}

module.exports = { procesarYGuardarFoto, eliminarArchivosDeFoto, FotoInvalidaError };

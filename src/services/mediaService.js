const crypto = require('crypto');
const path = require('path');
const fs = require('fs/promises');
const { execFile } = require('child_process');
const sharp = require('sharp');
const fileType = require('file-type');
const ffmpegPath = require('ffmpeg-static');
const env = require('../config/env');

const TIPOS_FOTO = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TIPOS_VIDEO = new Set(['video/mp4', 'video/quicktime', 'video/webm']);

class FotoInvalidaError extends Error {
  constructor(mensajeParaElUsuario) {
    super(mensajeParaElUsuario);
    this.mensajeParaElUsuario = mensajeParaElUsuario;
  }
}

function generarIdentificadorAleatorio() {
  return `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
}

async function detectarTipoArchivo(rutaTemporal) {
  const manejador = await fs.open(rutaTemporal, 'r');
  try {
    const buffer = Buffer.alloc(fileType.minimumBytes);
    const { bytesRead } = await manejador.read(buffer, 0, fileType.minimumBytes, 0);
    return fileType(buffer.subarray(0, bytesRead));
  } finally {
    await manejador.close();
  }
}

function moverArchivo(origen, destino) {
  return fs.rename(origen, destino).catch(async () => {
    await fs.copyFile(origen, destino);
    await fs.unlink(origen);
  });
}

function ejecutarFfmpeg(argumentos) {
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, argumentos, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function procesarFoto(rutaTemporal, extension) {
  const id = generarIdentificadorAleatorio();
  const nombreOriginal = `${id}.${extension}`;
  const nombreThumb = `thumb-${id}.jpg`;
  const nombreWeb = `web-${id}.jpg`;

  let metadata;
  try {
    metadata = await sharp(rutaTemporal).metadata();
  } catch (error) {
    await fs.unlink(rutaTemporal).catch(() => {});
    throw new FotoInvalidaError(
      'No se pudo abrir esa imagen. Puede estar dañada. Intenta con otra foto.'
    );
  }

  await sharp(rutaTemporal)
    .rotate()
    .resize({ width: 400, height: 400, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 75 })
    .toFile(path.join(env.rutas.thumb, nombreThumb));

  await sharp(rutaTemporal)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(path.join(env.rutas.web, nombreWeb));

  await moverArchivo(rutaTemporal, path.join(env.rutas.original, nombreOriginal));

  return {
    tipo: 'foto',
    nombreArchivo: id,
    rutaOriginal: nombreOriginal,
    rutaThumbnail: nombreThumb,
    rutaWeb: nombreWeb,
    ancho: metadata.width,
    alto: metadata.height,
  };
}

async function procesarVideo(rutaTemporal, extension) {
  const id = generarIdentificadorAleatorio();
  const nombreOriginal = `${id}.${extension}`;
  const nombreThumb = `thumb-${id}.jpg`;
  const rutaOriginalFinal = path.join(env.rutas.original, nombreOriginal);

  await moverArchivo(rutaTemporal, rutaOriginalFinal);

  let hayMiniatura = true;
  try {
    await ejecutarFfmpeg([
      '-y',
      '-i',
      rutaOriginalFinal,
      '-ss',
      '00:00:01',
      '-frames:v',
      '1',
      '-vf',
      'scale=400:400:force_original_aspect_ratio=increase,crop=400:400',
      path.join(env.rutas.thumb, nombreThumb),
    ]);
  } catch (error) {
    hayMiniatura = false;
  }

  return {
    tipo: 'video',
    nombreArchivo: id,
    rutaOriginal: nombreOriginal,
    rutaThumbnail: hayMiniatura ? nombreThumb : '',
    rutaWeb: nombreOriginal,
  };
}

async function transcodificarVideoCompatible(rutaOriginalCompleta, nombreWebDestino) {
  await ejecutarFfmpeg([
    '-y',
    '-i',
    rutaOriginalCompleta,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '25',
    '-vf',
    "scale='min(1280,iw)':-2",
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    path.join(env.rutas.web, nombreWebDestino),
  ]);
}

async function procesarYGuardarArchivo(rutaTemporal) {
  const tipoDetectado = await detectarTipoArchivo(rutaTemporal);

  if (!tipoDetectado) {
    await fs.unlink(rutaTemporal).catch(() => {});
    throw new FotoInvalidaError(
      'Ese archivo no se reconoce. Sube una foto (JPG, PNG, WEBP) o un video (MP4, MOV, WEBM).'
    );
  }

  const estadisticas = await fs.stat(rutaTemporal);

  if (TIPOS_FOTO.has(tipoDetectado.mime)) {
    if (estadisticas.size > env.maxFotoBytes) {
      await fs.unlink(rutaTemporal).catch(() => {});
      throw new FotoInvalidaError(
        `Esa foto es muy grande (máximo ${env.maxFotoMB} MB). ¿Puedes comprimirla o tomarla con menor calidad?`
      );
    }
    return procesarFoto(rutaTemporal, tipoDetectado.ext);
  }

  if (TIPOS_VIDEO.has(tipoDetectado.mime)) {
    if (estadisticas.size > env.maxVideoBytes) {
      await fs.unlink(rutaTemporal).catch(() => {});
      throw new FotoInvalidaError(
        `Ese video es muy grande (máximo ${env.maxVideoMB} MB). ¿Puedes grabar uno más corto o de menor calidad?`
      );
    }
    return procesarVideo(rutaTemporal, tipoDetectado.ext);
  }

  await fs.unlink(rutaTemporal).catch(() => {});
  throw new FotoInvalidaError(
    'Ese archivo no se puede usar. Sube una foto (JPG, PNG, WEBP) o un video (MP4, MOV, WEBM).'
  );
}

async function eliminarArchivosDeFoto(foto) {
  const rutas = [path.join(env.rutas.original, foto.ruta_original)];
  if (foto.ruta_thumbnail) {
    rutas.push(path.join(env.rutas.thumb, foto.ruta_thumbnail));
  }
  if (foto.tipo !== 'video' || (foto.ruta_web && foto.ruta_web !== foto.ruta_original)) {
    rutas.push(path.join(env.rutas.web, foto.ruta_web));
  }
  await Promise.all(rutas.map((ruta) => fs.unlink(ruta).catch(() => {})));
}

module.exports = {
  procesarYGuardarArchivo,
  transcodificarVideoCompatible,
  eliminarArchivosDeFoto,
  FotoInvalidaError,
};

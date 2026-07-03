const db = require('../config/db');

function listarPorCarpeta(carpetaId) {
  return db
    .prepare('SELECT * FROM fotos WHERE carpeta_id = ? ORDER BY orden ASC, fecha_subida DESC')
    .all(carpetaId);
}

function buscarPorId(id) {
  return db.prepare('SELECT * FROM fotos WHERE id = ?').get(id);
}

function crear({ carpetaId, nombreArchivo, rutaOriginal, rutaThumbnail, rutaWeb, descripcion }) {
  const info = db
    .prepare(
      `INSERT INTO fotos (carpeta_id, nombre_archivo, ruta_original, ruta_thumbnail, ruta_web, descripcion)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(carpetaId, nombreArchivo, rutaOriginal, rutaThumbnail, rutaWeb, descripcion || '');
  return buscarPorId(info.lastInsertRowid);
}

function actualizarDescripcion(id, descripcion) {
  db.prepare('UPDATE fotos SET descripcion = ? WHERE id = ?').run(descripcion, id);
}

function eliminar(id) {
  db.prepare('DELETE FROM fotos WHERE id = ?').run(id);
}

module.exports = { listarPorCarpeta, buscarPorId, crear, actualizarDescripcion, eliminar };

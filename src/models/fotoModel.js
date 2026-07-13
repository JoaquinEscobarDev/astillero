const db = require('../config/db');

function listarPorCarpeta(carpetaId) {
  return db
    .prepare('SELECT * FROM fotos WHERE carpeta_id = ? ORDER BY orden ASC, fecha_subida DESC')
    .all(carpetaId);
}

function buscarPorId(id) {
  return db.prepare('SELECT * FROM fotos WHERE id = ?').get(id);
}

function crear({ carpetaId, tipo, nombreArchivo, rutaOriginal, rutaThumbnail, rutaWeb, descripcion, procesando }) {
  const info = db
    .prepare(
      `INSERT INTO fotos (carpeta_id, tipo, nombre_archivo, ruta_original, ruta_thumbnail, ruta_web, descripcion, procesando)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(carpetaId, tipo || 'foto', nombreArchivo, rutaOriginal, rutaThumbnail, rutaWeb, descripcion || '', procesando ? 1 : 0);
  return buscarPorId(info.lastInsertRowid);
}

function marcarListo(id, rutaWeb) {
  db.prepare('UPDATE fotos SET ruta_web = ?, procesando = 0 WHERE id = ?').run(rutaWeb, id);
}

function actualizarDescripcion(id, descripcion) {
  db.prepare('UPDATE fotos SET descripcion = ? WHERE id = ?').run(descripcion, id);
}

function eliminar(id) {
  db.prepare('DELETE FROM fotos WHERE id = ?').run(id);
}

module.exports = { listarPorCarpeta, buscarPorId, crear, marcarListo, actualizarDescripcion, eliminar };

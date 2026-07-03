const db = require('../config/db');

function listarTodas() {
  return db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM fotos f WHERE f.carpeta_id = c.id) AS total_fotos,
              (SELECT f2.ruta_thumbnail FROM fotos f2 WHERE f2.carpeta_id = c.id ORDER BY f2.orden ASC, f2.id ASC LIMIT 1) AS portada
       FROM carpetas c
       ORDER BY c.orden ASC, c.fecha_creacion DESC`
    )
    .all();
}

function buscarPorId(id) {
  return db.prepare('SELECT * FROM carpetas WHERE id = ?').get(id);
}

function crear({ usuarioId, nombre }) {
  const info = db
    .prepare('INSERT INTO carpetas (usuario_id, nombre) VALUES (?, ?)')
    .run(usuarioId, nombre);
  return buscarPorId(info.lastInsertRowid);
}

function renombrar(id, nuevoNombre) {
  db.prepare('UPDATE carpetas SET nombre = ? WHERE id = ?').run(nuevoNombre, id);
}

function eliminar(id) {
  db.prepare('DELETE FROM carpetas WHERE id = ?').run(id);
}

module.exports = { listarTodas, buscarPorId, crear, renombrar, eliminar };

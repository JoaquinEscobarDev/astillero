const db = require('../config/db');

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;

function buscarPorUsuario(usuario) {
  return db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario);
}

function buscarPorId(id) {
  return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
}

function crear({ usuario, nombre, hashPassword, rol }) {
  const info = db
    .prepare('INSERT INTO usuarios (usuario, nombre, hash_password, rol) VALUES (?, ?, ?, ?)')
    .run(usuario, nombre, hashPassword, rol);
  return buscarPorId(info.lastInsertRowid);
}

function estaBloqueado(fila) {
  if (!fila.bloqueado_hasta) return false;
  return new Date(fila.bloqueado_hasta + 'Z').getTime() > Date.now();
}

function registrarIntentoFallido(id) {
  const fila = buscarPorId(id);
  const intentos = fila.intentos_fallidos + 1;
  if (intentos >= MAX_INTENTOS) {
    const bloqueadoHasta = new Date(Date.now() + MINUTOS_BLOQUEO * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    db.prepare('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = ? WHERE id = ?').run(
      bloqueadoHasta,
      id
    );
  } else {
    db.prepare('UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?').run(intentos, id);
  }
}

function limpiarIntentos(id) {
  db.prepare('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?').run(id);
}

module.exports = {
  buscarPorUsuario,
  buscarPorId,
  crear,
  estaBloqueado,
  registrarIntentoFallido,
  limpiarIntentos,
  MINUTOS_BLOQUEO,
};

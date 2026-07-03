const session = require('express-session');
const db = require('./db');

class AlmacenSesionesSqlite extends session.Store {
  constructor() {
    super();
    this.limpiarExpiradas();
    this.intervalo = setInterval(() => this.limpiarExpiradas(), 60 * 60 * 1000);
    this.intervalo.unref();
  }

  limpiarExpiradas() {
    db.prepare('DELETE FROM sesiones_http WHERE expira < ?').run(Date.now());
  }

  get(sid, callback) {
    try {
      const fila = db
        .prepare('SELECT datos FROM sesiones_http WHERE sid = ? AND expira >= ?')
        .get(sid, Date.now());
      callback(null, fila ? JSON.parse(fila.datos) : null);
    } catch (error) {
      callback(error);
    }
  }

  set(sid, sesion, callback) {
    try {
      const maxAge = sesion.cookie && sesion.cookie.maxAge ? sesion.cookie.maxAge : 1000 * 60 * 60 * 24;
      const expira = Date.now() + maxAge;
      db.prepare(
        `INSERT INTO sesiones_http (sid, datos, expira) VALUES (?, ?, ?)
         ON CONFLICT(sid) DO UPDATE SET datos = excluded.datos, expira = excluded.expira`
      ).run(sid, JSON.stringify(sesion), expira);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  destroy(sid, callback) {
    try {
      db.prepare('DELETE FROM sesiones_http WHERE sid = ?').run(sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sid, sesion, callback) {
    this.set(sid, sesion, callback);
  }
}

module.exports = AlmacenSesionesSqlite;

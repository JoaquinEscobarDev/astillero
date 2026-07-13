const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const env = require('./env');

fs.mkdirSync(path.dirname(env.archivoBaseDeDatos), { recursive: true });

const db = new Database(env.archivoBaseDeDatos);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const esquema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(esquema);

const columnasFotos = db.prepare("PRAGMA table_info(fotos)").all();
const nombresColumnas = columnasFotos.map((columna) => columna.name);

if (!nombresColumnas.includes('tipo')) {
  db.exec("ALTER TABLE fotos ADD COLUMN tipo TEXT NOT NULL DEFAULT 'foto'");
}
if (!nombresColumnas.includes('procesando')) {
  db.exec('ALTER TABLE fotos ADD COLUMN procesando INTEGER NOT NULL DEFAULT 0');
}

module.exports = db;

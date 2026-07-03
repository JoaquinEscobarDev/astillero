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

module.exports = db;

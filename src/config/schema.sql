-- Esquema de la base de datos de la galeria del astillero.
-- Se ejecuta automaticamente al iniciar el servidor (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  hash_password TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('dueno', 'admin')),
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carpetas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fotos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  carpeta_id INTEGER NOT NULL REFERENCES carpetas(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  ruta_original TEXT NOT NULL,
  ruta_thumbnail TEXT NOT NULL,
  ruta_web TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  fecha_subida TEXT NOT NULL DEFAULT (datetime('now')),
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_carpetas_usuario ON carpetas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fotos_carpeta ON fotos(carpeta_id);

CREATE TABLE IF NOT EXISTS sesiones_http (
  sid TEXT PRIMARY KEY,
  datos TEXT NOT NULL,
  expira INTEGER NOT NULL
);

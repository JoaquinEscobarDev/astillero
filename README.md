# El Astillero

Galería personal (no e-commerce) para exhibir fotos de botes a escala en madera. Node.js + Express +
EJS, con SQLite como base de datos (un solo archivo, sin servidor de base de datos separado).

## Stack

- **Backend:** Node.js + Express, vistas renderizadas en el servidor con EJS.
- **Base de datos:** SQLite vía `better-sqlite3` (archivo único en `data/astillero.sqlite`).
- **Imágenes:** `sharp` genera automáticamente una miniatura (400x400) y una versión web
  comprimida (máx. 1600px) de cada foto subida; el archivo original se guarda aparte y solo se
  sirve al pedir "ver tamaño completo".
- **Sesiones:** almacén de sesiones propio sobre la misma base SQLite (sin dependencias nativas
  adicionales).
- **Seguridad:** bcrypt para contraseñas, protección CSRF (`csrf-csrf`), cabeceras de seguridad
  (`helmet`), límite de intentos de login (por cuenta y por IP), validación real de tipo de
  archivo (no solo por extensión), nombres de archivo aleatorios, `robots.txt` con disallow.

## Requisitos

- Node.js 18 o superior.

## Configuración local

```bash
npm install
cp .env.example .env
```

Edita `.env` y define `SESSION_SECRET` y `CSRF_SECRET` con textos largos y aleatorios distintos
entre sí (por ejemplo, generados con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

Crea el primer usuario (el dueño del contenido, por ejemplo tu papá):

```bash
npm run crear-usuario -- papa "Papá" "una-contraseña-segura" dueno
```

También puedes ejecutar `npm run crear-usuario` sin argumentos para que te pregunte los datos
uno por uno. El rol puede ser `dueno` o `admin` (dos niveles simples: dueño del contenido y
administrador técnico; ambos pueden usar la galería igual, el rol es solo informativo por ahora).

Levanta el servidor:

```bash
npm start
```

La página queda disponible en `http://localhost:3000`.

## Estructura del proyecto

```
server.js                  Punto de entrada
src/config/                Configuración, conexión a SQLite, esquema y almacén de sesiones
src/middleware/             Autenticación, CSRF, cabeceras de seguridad, límite de intentos, subida
src/models/                 Acceso a datos (usuarios, carpetas, fotos)
src/routes/                 Rutas de Express (auth, páginas, carpetas, fotos, medios)
src/services/imageService.js  Procesamiento de imágenes con sharp
src/scripts/crear-usuario.js  Script para crear usuarios
views/                       Plantillas EJS
public/                      CSS, JS del cliente, robots.txt
storage/original|thumb|web   Archivos de imagen (fuera del webroot público; se sirven solo
                             autenticado vía /media/:tipo/:archivo)
data/                        Base de datos SQLite (no se sube al repositorio)
```

## Despliegue en Hostinger (App de Node.js)

1. En hPanel, crea una nueva "Aplicación de Node.js" y conéctala a este repositorio de GitHub
   (o sube los archivos directamente).
2. Define las variables de entorno del archivo `.env.example` en la configuración de la app
   (nunca subas el archivo `.env` real al repositorio).
3. Pon `COOKIES_SEGURAS=true` una vez que el sitio tenga HTTPS activo (Hostinger ofrece SSL
   gratis con Let's Encrypt — actívalo en el panel del dominio).
4. El comando de inicio es `npm start` (usa `server.js`).
5. Ejecuta una vez `npm run crear-usuario -- <usuario> "<Nombre>" <contraseña> dueno` desde la
   terminal de la app para crear la cuenta real.
6. Verifica que las carpetas `data/` y `storage/` tengan permisos de escritura y que
   `storage/` no tenga permisos de ejecución de scripts.

### Respaldos

- La base de datos completa es un solo archivo: `data/astillero.sqlite`. Respaldarla es copiar
  ese archivo (hazlo con el sitio detenido o usando `sqlite3 data/astillero.sqlite ".backup respaldo.sqlite"`
  para un respaldo en caliente sin bloquear la app).
- Las fotos originales están en `storage/original/`. Progrma un respaldo periódico (cron de
  Hostinger o descarga manual) de esa carpeta junto con `data/astillero.sqlite`.

## Notas de diseño

- Pensado para un usuario con poca experiencia técnica: textos grandes (mínimo 18px), botones
  táctiles amplios (mínimo 44x44px), sin pasos ocultos, y confirmaciones explícitas ("Sí" / "No")
  antes de borrar cualquier cosa.
- El límite técnico de tamaño por foto (variable `MAX_FOTO_MB`, 40MB por defecto) es solo una
  protección del servidor; el usuario nunca necesita pensar en el peso del archivo.
- La columna `descripcion` de la tabla `fotos` queda lista para que, en una fase futura, se
  autocomplete con IA (ver la sección 9 del documento de requisitos original). No hay ninguna
  integración de IA implementada en esta versión.

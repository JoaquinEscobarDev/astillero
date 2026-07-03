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

**Importante — persistencia de datos:** cada vez que se hace "Redesplegar" desde el panel de
Hostinger, la carpeta de la app se reemplaza por una copia limpia del repositorio de GitHub.
Cualquier archivo que no esté en el repositorio (como la base de datos SQLite o las fotos
subidas) **se borra** si vive dentro de esa carpeta. Por eso `DATABASE_FILE` y `STORAGE_DIR`
deben apuntar a una carpeta **fuera** de la carpeta de la app (ej. directamente en el home del
usuario), para que sobrevivan a los redespliegues.

1. En hPanel, crea una nueva "Aplicación de Node.js" y conéctala a este repositorio de GitHub
   (o sube los archivos directamente).
2. Por SSH, crea una carpeta persistente fuera de la app, por ejemplo:
   ```bash
   mkdir -p ~/astillero-datos/storage
   ```
3. Define las variables de entorno de `.env.example` en la sección "Variables de entorno" del
   panel de la app (nunca subas el archivo `.env` real al repositorio). En particular:
   - `DATABASE_FILE=/home/tu_usuario/astillero-datos/astillero.sqlite`
   - `STORAGE_DIR=/home/tu_usuario/astillero-datos/storage`

   (Reemplaza `tu_usuario` por tu usuario real de Hostinger — lo ves en el prompt de la
   terminal SSH, ej. `u974181638`.)
4. Pon `COOKIES_SEGURAS=true` una vez que el sitio tenga HTTPS activo (Hostinger ofrece SSL
   gratis con Let's Encrypt — actívalo en el panel del dominio).
5. El comando de inicio es `npm start` (usa `server.js`).
6. Para ejecutar comandos sueltos (como crear un usuario) desde la terminal SSH de Hostinger,
   como esas variables de entorno del panel no se cargan automáticamente en la sesión SSH,
   crea un `.env` temporal dentro de la carpeta de la app con los mismos valores (se puede
   borrar después; solo lo necesitan los comandos manuales, no la app en si) y luego corre:
   ```bash
   npm run crear-usuario -- <usuario> "<Nombre>" <contraseña> dueno
   ```
7. Verifica que la carpeta persistente (`~/astillero-datos`) tenga permisos de escritura y que
   no tenga permisos de ejecución de scripts.

### Respaldos

- La base de datos completa es un solo archivo (la ruta de `DATABASE_FILE`). Respaldarla es
  copiar ese archivo (hazlo con el sitio detenido o usando
  `sqlite3 astillero.sqlite ".backup respaldo.sqlite"` para un respaldo en caliente sin bloquear
  la app).
- Las fotos originales están en `<STORAGE_DIR>/original/`. Programa un respaldo periódico (cron
  de Hostinger o descarga manual) de esa carpeta junto con la base de datos.

## Notas de diseño

- Pensado para un usuario con poca experiencia técnica: textos grandes (mínimo 18px), botones
  táctiles amplios (mínimo 44x44px), sin pasos ocultos, y confirmaciones explícitas ("Sí" / "No")
  antes de borrar cualquier cosa.
- El límite técnico de tamaño por foto (variable `MAX_FOTO_MB`, 40MB por defecto) es solo una
  protección del servidor; el usuario nunca necesita pensar en el peso del archivo.
- La columna `descripcion` de la tabla `fotos` queda lista para que, en una fase futura, se
  autocomplete con IA (ver la sección 9 del documento de requisitos original). No hay ninguna
  integración de IA implementada en esta versión.

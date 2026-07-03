const readline = require('readline');
const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');

function preguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      rl.close();
      resolve(respuesta);
    });
  });
}

async function obtenerDatos() {
  const [, , usuarioArg, nombreArg, passwordArg, rolArg] = process.argv;

  if (usuarioArg && nombreArg && passwordArg) {
    return { usuario: usuarioArg, nombre: nombreArg, password: passwordArg, rol: rolArg || 'dueno' };
  }

  console.log('--- Crear un usuario para El Astillero ---');
  console.log('(También puedes usar: npm run crear-usuario -- usuario "Nombre" contraseña rol)');
  const usuario = await preguntar('Nombre de usuario para ingresar (sin espacios): ');
  const nombre = await preguntar('Nombre para mostrar (ej: Papa): ');
  const password = await preguntar('Contraseña: ');
  const rolRespuesta = await preguntar('Rol (dueno / admin) [dueno]: ');
  return { usuario, nombre, password, rol: rolRespuesta || 'dueno' };
}

async function main() {
  const datos = await obtenerDatos();
  const usuario = datos.usuario.trim().toLowerCase();
  const nombre = datos.nombre.trim();
  const password = datos.password;
  const rol = datos.rol.trim().toLowerCase();

  if (!usuario || !nombre || !password) {
    console.error('Todos los datos son obligatorios. Intenta de nuevo.');
    process.exit(1);
  }

  if (rol !== 'dueno' && rol !== 'admin') {
    console.error('El rol debe ser "dueno" o "admin".');
    process.exit(1);
  }

  if (usuarioModel.buscarPorUsuario(usuario)) {
    console.error(`Ya existe un usuario con el nombre "${usuario}".`);
    process.exit(1);
  }

  const hashPassword = await bcrypt.hash(password, 12);
  usuarioModel.crear({ usuario, nombre, hashPassword, rol });

  console.log(`Usuario "${usuario}" creado con exito.`);
}

main().catch((error) => {
  console.error('Ocurrio un error creando el usuario:', error);
  process.exit(1);
});

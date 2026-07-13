const cola = [];
let procesandoAhora = false;

async function procesarSiguiente() {
  if (procesandoAhora) return;
  const tarea = cola.shift();
  if (!tarea) return;

  procesandoAhora = true;
  try {
    await tarea();
  } finally {
    procesandoAhora = false;
    procesarSiguiente();
  }
}

function encolar(tarea) {
  cola.push(tarea);
  procesarSiguiente();
}

module.exports = { encolar };

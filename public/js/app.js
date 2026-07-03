(function () {
  var zona = document.getElementById('zona-arrastrar');
  var input = document.getElementById('fotos');
  if (!zona || !input) return;

  var textoOriginal = zona.querySelector('span');
  var textoBase = textoOriginal ? textoOriginal.textContent : '';

  function actualizarTexto() {
    if (!textoOriginal) return;
    var cantidad = input.files ? input.files.length : 0;
    if (cantidad === 0) {
      textoOriginal.textContent = textoBase;
    } else if (cantidad === 1) {
      textoOriginal.textContent = '1 archivo listo para subir';
    } else {
      textoOriginal.textContent = cantidad + ' archivos listos para subir';
    }
  }

  input.addEventListener('change', actualizarTexto);

  ['dragenter', 'dragover'].forEach(function (evento) {
    zona.addEventListener(evento, function (e) {
      e.preventDefault();
      zona.classList.add('zona-arrastrar-activa');
    });
  });

  ['dragleave', 'drop'].forEach(function (evento) {
    zona.addEventListener(evento, function (e) {
      e.preventDefault();
      zona.classList.remove('zona-arrastrar-activa');
    });
  });

  zona.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      actualizarTexto();
    }
  });
})();

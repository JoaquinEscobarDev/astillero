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

  var formulario = document.getElementById('formulario-subida');
  var barra = document.getElementById('barra-progreso');
  var relleno = document.getElementById('barra-progreso-relleno');
  var textoProgreso = document.getElementById('texto-progreso');
  var botonSubir = formulario ? formulario.querySelector('button[type="submit"]') : null;

  if (formulario && window.XMLHttpRequest) {
    formulario.addEventListener('submit', function (evento) {
      if (!input.files || input.files.length === 0) return;
      evento.preventDefault();

      var datos = new FormData(formulario);
      var xhr = new XMLHttpRequest();
      xhr.open('POST', formulario.action);

      if (botonSubir) {
        botonSubir.disabled = true;
        botonSubir.textContent = 'Subiendo...';
      }
      if (barra) barra.classList.remove('oculto');
      if (textoProgreso) textoProgreso.textContent = 'Subiendo... no cierres esta página.';

      xhr.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable) {
          var porcentaje = Math.round((e.loaded / e.total) * 100);
          if (relleno) relleno.style.width = porcentaje + '%';
          if (textoProgreso) textoProgreso.textContent = 'Subiendo... ' + porcentaje + '% (no cierres esta página)';
        }
      });

      xhr.addEventListener('load', function () {
        window.location.href = xhr.responseURL || formulario.action;
      });

      xhr.addEventListener('error', function () {
        if (textoProgreso) textoProgreso.textContent = 'Hubo un problema de conexión. Revisa tu internet e intenta de nuevo.';
        if (botonSubir) {
          botonSubir.disabled = false;
          botonSubir.textContent = 'Subir';
        }
      });

      xhr.send(datos);
    });
  }
})();

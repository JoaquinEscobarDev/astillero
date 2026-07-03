function requiereSesion(req, res, next) {
  if (req.session && req.session.usuarioId) {
    return next();
  }
  return res.redirect('/ingresar');
}

function redirigirSiYaHaIngresado(req, res, next) {
  if (req.session && req.session.usuarioId) {
    return res.redirect('/');
  }
  return next();
}

module.exports = { requiereSesion, redirigirSiYaHaIngresado };

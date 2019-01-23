const { Router } = require('express');
const control = require('../controller');
const router = Router();
const cache = require('../util/cache-middleware');

//Ruta de acceso a los datos
router.get('/', cache(60), function (req, res) {
  control.ConsultaDatos(req, res);
});


//Ruta de acceso a los datos por fecha
router.get('/groupedBydate/:where/:value', cache(30), function (req, res) {
  control.ConsultaDatosPorFecha(req, res);
});

module.exports = router;

//Inyección de dependencias
let express = require('express');
let bodyParser = require('body-parser');
let cors = require('cors');

//Configuración de la API
require('events').EventEmitter.defaultMaxListeners = Infinity;

//Configuración
const config = require('./config');

//Importación de controladores
const control = require('./controller');

//Inicialización de la aplicación
let app = express();

//Configuración de nuestra API
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//Configuración de seguridad de la API
app.use(cors());

//Configuración del puerto de la API
app.set('port', config.puerto);

//Configuración de la cabecera
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', `http://${config.dominio}`);
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');
  next();
});

//Iniciamos las rutas de nuestro servidor/API
let rutas = express.Router();

//Ruta de bienvenida
rutas.get('/', function(req, res) {
  res.send({
    'Mensaje': 'Bienvenido a la API REST de datos estadisticos informaticos'
  });
});

//Ruta de acceso a los datos
rutas.get('/datos', function (req, res) {
  control.ConsultaDatos(req, res);
});

//Ruta de acceso a los datos por fecha
rutas.get('/datosfecha', function (req, res) {
  control.ConsultaDatosPorFecha(req, res);
});


//Inicialización de las rutas
app.use(rutas);

// Inicialización del servicio
app.listen(config.puerto, function() {
  console.log(`Node server ejecutandose en http://${config.dominio}:${config.puerto}`);
});
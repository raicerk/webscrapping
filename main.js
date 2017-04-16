const express     = require('express');
const mongoose    = require('mongoose');
const session     = require('cookie-session');
const frameguard  = require('frameguard');
const hsts        = require('hsts');
const fs          = require('fs');
const https       = require('https');
const cors        = require('cors');
const helmet      = require('helmet');
const moment      = require('moment');

const app         = express();

const config      = require('./config');
const modelo      = require('./models')(app,mongoose);
const control     = require('./controller');

// Cargamos certificados de seguridad SSL/TSL
var options = {
   key  : fs.readFileSync(config.certificados.private),
   cert : fs.readFileSync(config.certificados.certificado)
};

app.use(cors());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', config.domain);
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type','application/json');
    next();
});

// Configuramos Express
app.use(helmet());

// Seguridad para no permitir el uso del sitio con iframe
app.use(frameguard({ action: 'deny' }));

// Seguridad para el uso exclusivo de protocolo https para la llamada a la api
// Solicitar validación en sitio https://hstspreload.org
app.use(hsts({
    maxAge: 10886400,
    includeSubDomains: true,
    preload: true
}))

// Configuración de cookies seguras
app.use(session({
    name: config.nombresession,
    keys: [config.llaveseguridadcookie],
    cookie: {
            secure: true,
            httpOnly: true,
            domain: config.domain,
            expires: moment().hour(1).format()
        }
    })
);


control.Programable();

app.get('/datos',function(req,res){
  control.ConsultaDatos(req,res);
});

mongoose.connect('mongodb://localhost/scrapping',function(err,res){
  if (err) {
    console.log('Error de conexion a mongodb');
  }else{
    https.createServer(options, app).listen(app.get('port'), function () {
          console.log('Express corriendo en '+config.domain+':'+config.puerto);
    });
    console.log('Conectado a mongodb');
  }
})

app.set('port', config.puerto);

console.log(`Ejecutando en puerto ${config.puerto}`);

exports = module.exports = app;

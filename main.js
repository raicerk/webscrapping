const config   = require('./config');
const express  = require('express');
const mongoose = require('mongoose');

const app      = express();

const modelo   = require('./models')(app,mongoose);
const control  = require('./controller');


control.Programable();

app.get('/datos',function(req,res){
  control.ConsultaDatos(req,res);
});

mongoose.connect('mongodb://localhost/scrapping',function(err,res){
  if (err) {
    console.log('Error de conexion a mongodb');
  }else{
    console.log('Conectado a mongodb');
    console.log(`http://localhost:${config.puerto}`);
  }
})

app.listen(config.puerto);

console.log(`Ejecutando en puerto ${config.puerto}`);

exports = module.exports = app;

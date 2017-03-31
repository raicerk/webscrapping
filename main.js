var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var config  = require('./config');

var mongoose = require('mongoose');
var modelo = require('./models')(app,mongoose);
var control = require('./controller');



app.get('/', function(req, res){

  request(config.sitio, function(error, response, html){

    let datos = [];

    if(!error){

      var $ = cheerio.load(html);

      var count = 1;

      $('.job').filter(function(){

        count = count+1;

        var data = $(this);
        let obj = [];
        let json = {};

        json.link = data[0].children[0].next.attribs.href;
        json.fecha = data[0].children[0].next.children[7].next.children[0].data.replace(/\n/g, '')

        let me = data.find('.ellipsis .tag');

        for (var i = 0; i < me.length; i++) {
          obj.push(me[i].children[0].data);
        }

        json.skill = obj;

        control.registro(json);

        console.log(count);
      })

    }else {

      res.send({estado:false});

    }

    res.status(200).send({mensaje:'holiwis'});

  })

})

mongoose.connect('mongodb://localhost/scrapping',function(err,res){
  if (err) {
    console.log('Error de conexion a mongodb');
  }else{
    console.log('Conectado a mongodb');
  }
})

app.listen(config.puerto);

console.log(`Ejecutando en puerto ${config.puerto}`);

exports = module.exports = app;

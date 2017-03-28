var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var config  = require('./config');

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

        datos.push(json);
        console.log(count);
      })

      res.send(datos);

    }else {

      res.send({estado:false});

    }

  })

})

app.listen(config.puerto);

console.log(`Ejecutando en puerto ${config.puerto}`);

exports = module.exports = app;

var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var config = require('./config');

app.get('/', function(req, res){

  request(config.sitio, function(error, response, html){

    let json = {};

    if(!error){

      var $ = cheerio.load(html);

      $('.job').filter(function(){

        var data = $(this);

        json.link = data[0].children[0].next.attribs.href;
        console.log('-----------------------------------');
        console.log(data[0].children[0].next.children[7].next.children[0].data.replace(/\n/g, ''));
        console.log('-----------------------------------');
        let me = data.find('.ellipsis .tag');

        let obj = [];

        for (var i = 0; i < me.length; i++) {
          obj.push(me[i].children[0].data);
        }

        json.skill = JSON.stringify(obj);

      })
      res.send({estado:true});
    }else {
      res.send({estado:false});
    }
  })
})

app.listen(config.puerto);

console.log(`Ejecutando en puerto ${config.puerto}`);

exports = module.exports = app;

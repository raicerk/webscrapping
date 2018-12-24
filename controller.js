var cheerio = require('cheerio');
var config = require('./config');
var request = require('request');
const moment = require('moment');
var admin = require("firebase-admin");
var serviceAccount = require("firebase-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.databaseURL
});

exports.scrapping = function () {

  console.log("Scrapping iniciado.");

  request(config.sitio, function (error, response, html) {

    let datos = [];

    if (!error) {

      var $ = cheerio.load(html);

      var count = 1;

      $('.job').filter(function () {

        count = count + 1;

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

        exports.registro(json);

      })
      console.log("Scrapping finalizado.");
    } else {
      return false;
    }
    return true;
  })

}

exports.registro = function (req) {

  try {

    // var data = new User({
    //   link: req.link,
    //   fecha: req.fecha,
    //   skill: req.skill
    // });

    // data.save(function (err, res) {
    //   if (!err) {
    //     console.log("Almacenado correctamente" + res._id);
    //   }
    // });
  } catch (e) {
    console.log(e);
    return false;
  }
};

exports.ConsultaDatos = function (req, res) {
  var o = {};
  o.map = function () {
    var datos = JSON.stringify(this.skill).replace(/[\"\]\[]/g, '');
    var skill = datos.split(',');
    for (i in skill) {
      emit(skill[i], 1);
    }
  }

  o.reduce = function (key, values) {

    var count = 0;
    for (i in values) {
      count += values[i];
    }
    return count;
  }

  User.mapReduce(o, function (err, results) {
    res.status(200).jsonp(results);
  });
}

exports.Programable = function () {
  var nuevaHora = moment().add(5, 'seconds').format("YYYY-MM-DD HH:mm:ss");
  console.log(`La ejecución sera el ${nuevaHora}`);
  setInterval(function () {
    var hora = moment().format("YYYY-MM-DD HH:mm:ss");
    if (hora == nuevaHora) {
      console.log(`Ejecución ${nuevaHora}`);
      exports.scrapping();
      nuevaHora = moment(new Date(nuevaHora));
      nuevaHora.add(Math.floor(Math.random() * (Math.floor(config.minutosMaximos) - Math.ceil(config.minutosMinimos) + 1)) + Math.ceil(config.minutosMinimos), 'minutes');
      nuevaHora = nuevaHora.format("YYYY-MM-DD HH:mm:ss");
      console.log(`Proxima ejecución ${nuevaHora}`);
    }
  }, 1000);
}

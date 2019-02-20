const request = require('postman-request');
const cheerio = require('cheerio');
const moment = require('moment');
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin.json");
const config = require('./config');

/**
 * Carga de configuracion para firebase
 */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/**
 * Carga de configuracion de firestore de firebase
 */
var db = admin.firestore();
db.settings({
  timestampsInSnapshots: true
});

/**
 * Lee sitio web y tabula información
 * return boolean
 */
exports.scrapping = async function () {

  try {
    var datos = config.sitios;

    for (i in datos) {

      Object.keys(datos[i].sitios).forEach(function eachKey(clasificacion) {

        var pais = datos[i].pais;
        var dominio = datos[i].dominiositio;
        var url = datos[i].sitios[clasificacion];

        request(url, function (error, response, body) {

          console.log(error);
          console.log(response);

          try {
            var $ = cheerio.load(body);

            var count = 1;

            $('.job').filter(function () {

              count = count + 1;

              var data = $(this);
              let obj = [];
              let json = {};

              json.link = data[0].children[0].next.attribs.href;
              json.fecha = data[0].children[0].next.children[7].next.children[0].data.replace(/\n/g, '');
              json.clasificacion = clasificacion;
              json.pais = pais;
              json.dominio = dominio;

              let me = data.find('.ellipsis .tag');

              for (var i = 0; i < me.length; i++) {
                obj.push(me[i].children[0].data);
              }

              json.skill = obj;

              exports.registro(json);

            });
          } catch (error) {
            console.error(error);
          }

        });
      })
    }
  } catch (error) {
    console.log("error ssss");
  }

};

/**
 * Almacena información en db de scrapping
 * return Promise
 */
exports.registro = function (req) {
  return new Promise((resolve, reject) => {

    let ms = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"].indexOf(req.fecha.split(' ')[0]) + 1;

    let dia = req.fecha.split(' ')[1];
    let mes = ms < 10 ? `0${ms}` : ms;
    let ano = ms >= moment().month() + 1 ? 2018 : moment().year();
    let id = req.pais + ":" + req.link.split('/')[5];

    try {

      var data = {
        pais: req.pais,
        link: req.link,
        fecha: `${ano}-${mes}-${dia}`,
        skill: req.skill,
        clasificacion: req.clasificacion
      };

      if (db.collection('laboral').doc(id).set(data)) {
        resolve(true);
      } else {
        console.log("errorrrr al insertar")
        resolve(false);
      }

    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
};

/**
 * Metodo recursivo para autoprogramar la ejecución del scrapping de manera aleatoria con sistema de minutos maximos y minimos.
 * return void
 */
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
};
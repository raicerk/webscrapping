const serviceAccount = require("./firebase-admin.json");
const config = require('./config');
const util = require('./util');
const cheerio = require('cheerio');
const moment = require('moment');
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
db.settings({
  timestampsInSnapshots: true
});

/**
 * Lee sitio web y tabula información
 * return boolean
 */
exports.scrapping = function () {

  console.log("Scrapping iniciado.");

  var datos = config.sitios;

  for (i in datos) {

    var pais = datos[i].pais;
    var dominio = datos[i].dominiositio;

    Object.keys(datos[i].sitios).forEach(async function eachKey(clasificacion) {

      var datito = await util.obtieneHTML(datos[i].sitios[clasificacion]);

      var $ = cheerio.load(datito);

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

        await exports.registro(json);

      });
    })

    console.log("Scrapping finalizado.");
  }

};

/**
 * Almacena inform ación en db de scrapping
 * return Promise
 */
exports.registro = function (req) {
  return new Promise((resolve, reject) => {

    let ms = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"].indexOf(req.fecha.split(' ')[0]) + 1;

    let dia = req.fecha.split(' ')[1];
    let mes = ms < 10 ? `0${ms}` : ms;
    let ano = ms >= 2 ? 2018 : moment().year();
    let id = req.pais + ":" + req.link.split('/')[3];

    try {

      var data = {
        pais: req.pais,
        link: `${req.dominio}${req.link}`,
        fecha: `${ano}-${mes}-${dia}`,
        skill: req.skill,
        clasificacion: req.clasificacion
      };

      if (db.collection('laboral').doc(id).set(data)) {
        resolve(true);
      } else {
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
const cheerio = require('cheerio');
const moment = require('moment');
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin.json");
const config = require('./config');
const util = require('./util');
const axios = require('axios').default;
const dbmongo = require('./db');

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
exports.scrapping = async () => {

  try {

    let conn = await dbmongo.ConnectDB();

    let data = await util.obtieneLink();

    data.map(async item => {

      let body = await axios.get(item.link, {
        headers: {
          'Accept-Language': 'es-ES,es;q=0.9'
        }
      })
      let $ = cheerio.load(body.data, { decodeEntities: false });

      let json = {};
      json.link = item.link;
      json.fecha = $(".mb3.mt2.flex.align-content-center").find("time").html().replace(/\n/g, '');
      json.clasificacion = item.clasificacion
      json.pais = item.pais;
      json.dominio = item.dominio;
      json.compania = $(".size1.m0 strong").html();
      json.sueldo = $(".size2.mb-3.mt-3 strong").html() != null ? $(".size2.mb-3.mt-3 strong").html().replace(/^\n|\n$/g, '').replace(/\n/g, " ") : null;
      json.skill = []
      $(".gb-tags__item").map((i, el) => {
        json.skill.push($(el).html())
      })
      exports.registro(json, conn);
    })


  } catch (error) {
    console.log("error ssss" + error);
  }

};

/**
 * Almacena información en db de scrapping
 * return Promise
 */
exports.registro = (req, conn) => {
  return new Promise(async (resolve, reject) => {

    try {

      let id = req.pais + ":" + req.link.split('/')[5];

      var sueldominimo = "";
      var sueldomaximo = "";
      var sueldomoneda = "";
      var sueldotipotiempo = "";

      if (req.sueldo != null) {
        if (req.sueldo.split("-").length == 2) {
          sueldominimo = req.sueldo == undefined ? null : parseInt(req.sueldo.split("-")[0].trim().replace("$", ""))
          sueldomaximo = req.sueldo == undefined ? null : parseInt(req.sueldo.split("-")[1].trim().split(" ")[0])
          sueldomoneda = req.sueldo == undefined ? null : req.sueldo.split("-")[1].trim().split(" ")[1].split("/")[0]
          sueldotipotiempo = req.sueldo == undefined ? null : req.sueldo.split("-")[1].trim().split(" ")[1].split("/")[1]
        } else {
          sueldominimo = req.sueldo == undefined ? null : parseInt(req.sueldo.split("-")[0].trim().replace("$", ""))
          sueldomaximo = req.sueldo == undefined ? null : parseInt(req.sueldo.split("-")[0].trim().replace("$", ""))
          sueldomoneda = req.sueldo == undefined ? null : req.sueldo.split("-")[0].trim().split(" ")[1].split("/")[0]
          sueldotipotiempo = req.sueldo == undefined ? null : req.sueldo.split("-")[0].trim().split(" ")[1].split("/")[1]
        }
      }

      var data = {
        pais: req.pais,
        link: req.link,
        fecha: util.normalizafecha(req.fecha),
        skill: req.skill,
        clasificacion: req.clasificacion,
        sueldo: req.sueldo == undefined ? null : req.sueldo,
        sueldominimo,
        sueldomaximo,
        sueldomoneda,
        sueldotipotiempo,
        compania: req.compania
      };

      db.collection('laboral').doc(id).set(data)

      let datafrommongo = data;
      datafrommongo.unique = id;

      conn.collection("laboral").insertOne(datafrommongo).then(response => {
        console.log(response.result)
      }).catch(error => {
        console.log(error)
      })

    } catch (e) {
      console.log(req)
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
const request = require('postman-request');
const cheerio = require('cheerio');
const moment = require('moment');
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin.json");
const config = require('./config');
const MongoClient = require('mongodb').MongoClient;

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

    let conn = await exports.ConnectDB();

    var datos = config.sitios;

    for (i in datos) {

      Object.keys(datos[i].sitios).forEach(function eachKey(clasificacion) {

        var pais = datos[i].pais;
        var dominio = datos[i].dominiositio;
        var url = datos[i].sitios[clasificacion];

        request(url, function (error, response, body) {

          try {
            var $ = cheerio.load(body);

            $('.sgb-results-list div a').each(function (i) {

              var data = $(this);
              let json = {};

              json.link = data[0].attribs.href;
              json.fecha = data[0].children[2].children[5].children[0].data.replace(/\n/g, '');
              json.clasificacion = clasificacion;
              json.pais = pais;
              json.dominio = dominio;

              json.compania = data.find('.size0')[0].firstChild.data.trim();

              let money = data.find('.fa-money');

              if (money[0]) {
                json.sueldo = money[0].attribs.title;
              }

              let me = data.find('.gb-results-list__limited-info');

              json.skill = me[0].children[2].data.replace(/\n/g, '').split(",").map(item => {
                return item.trim()
              });

              exports.registro(json,conn);

            });
          } catch (error) {
            console.error(error);
          }

        });
      })
    }
  } catch (error) {
    console.log("error ssss" + error);
  }

};

/**
 * Almacena información en db de scrapping
 * return Promise
 */
exports.registro = (req,conn) => {
  return new Promise((resolve, reject) => {

    let ms = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"].indexOf(req.fecha.split(' ')[0]) + 1;

    let dia = req.fecha.split(' ')[1];
    let mes = ms < 10 ? `0${ms}` : ms;
    let ano = ms > moment().month() + 1 ? 2018 : moment().year();
    let id = req.pais + ":" + req.link.split('/')[5];

    try {

      var data = {
        pais: req.pais,
        link: req.link,
        fecha: `${ano}-${mes}-${dia}`,
        skill: req.skill,
        clasificacion: req.clasificacion,
        sueldo: req.sueldo == undefined ? null : req.sueldo,
        sueldominimo: req.sueldo == undefined ? null : parseInt(req.sueldo.split("-")[0].trim()),
        sueldomaximo: req.sueldo == undefined ? null : parseInt(req.sueldo.split("-")[1].trim().split(" ")[0]),
        sueldomoneda: req.sueldo == undefined ? null : req.sueldo.split("-")[1].trim().split(" ")[1].split("/")[0],
        sueldotipotiempo: req.sueldo == undefined ? null : req.sueldo.split("-")[1].trim().split(" ")[1].split("/")[1],
        compania: req.compania
      };

      let dataFirebase = db.collection('laboral').doc(id).set(data);
      
      


      let datafrommongo = data;
      datafrommongo.unique = id;

      conn.collection("laboral").insertOne(datafrommongo).then(result => {
        conn.close();
      }).catch(error=>{
        //console.log(error)
      })

      
      
      
      
      
      if (dataFirebase) {
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

exports.ConnectDB = () => {
  try {
    let url = `mongodb+srv://${config.db.DB_USER}:${config.db.DB_PASSWORD}@${config.db.DB_HOST}/${config.db.DB_NAME}`;
    return new Promise((resolve, reject) => {
      var settings = {
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 100,
        autoReconnect: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        poolSize: 2

      };
      let client = new MongoClient(url, settings);
      client.connect().then(() => {
        resolve(client.db(config.db.DB_NAME))
      }).catch(err => {
        reject(err)
      })
    })
  } catch (error) {
    nl.register(`Error en la conexion de la base de datos de mongo historico, el detalle es: ${error}`).error();
  }
}
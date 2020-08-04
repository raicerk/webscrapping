const cheerio = require('cheerio');
const moment = require('moment');
const admin = require("firebase-admin");
const axios = require('axios').default;

const serviceAccount = require("./firebase-admin.json");

const { normalizafecha, obtieneLink } = require('./util');
const { ConnectDB } = require('./db');
const { minutosMaximos, minutosMinimos } = require('./config');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
db.settings({
  timestampsInSnapshots: true
});

const scrapping = async () => {
  try {

    let conn = await ConnectDB();
    let data = await obtieneLink();

    const registros = data.map(async item => {

      let body = await axios.get(item.link, {
        headers: {
          'Accept-Language': 'es-ES,es;q=0.9'
        }
      })

      let $ = cheerio.load(body.data, { decodeEntities: false });

      let json = {};
      json.link = item.link;
      json.fecha = $("time").html().replace(/\n/g, '');
      json.clasificacion = item.clasificacion
      json.pais = item.pais;
      json.dominio = item.dominio;
      json.compania = $(".size1.m0 strong").html();
      json.sueldo = $(".size2.mb-3.mt-3 strong").html() != null ? $(".size2.mb-3.mt-3 strong").html().replace(/^\n|\n$/g, '').replace(/\n/g, " ") : null;
      json.skill = []
      $(".gb-tags__item").map((i, el) => {
        json.skill.push($(el).html())
      })
      return registro(json, conn);
    });

    await Promise.all(registros);

  } catch (error) {
    console.log("error ssss" + error);
  }

};

const registro = (req, conn) => {
  return new Promise(async (resolve, reject) => {

    try {

      const id = req.pais + ":" + req.link.split('/')[5];

      var sueldominimo = null;
      var sueldomaximo = null;
      var sueldomoneda = null;
      var sueldotipotiempo = null;

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

      const data = {
        pais: req.pais,
        link: req.link,
        fecha: normalizafecha(req.fecha),
        skill: req.skill,
        clasificacion: req.clasificacion,
        sueldo: req.sueldo == undefined ? null : req.sueldo,
        sueldominimo,
        sueldomaximo,
        sueldomoneda,
        sueldotipotiempo,
        compania: req.compania
      };

      let datafrommongo = { ...data };
      Object.assign(datafrommongo, {unique: id})

      const resultDB = await Promise.all([
        db.collection('laboral').doc(id).set(data),
        conn.collection("laboral").insertOne(datafrommongo)
      ]);

      resolve(resultDB);

    } catch (error) {
      reject(error);
    }
  });
};

const Programable = () => {
  try {
    var nuevaHora = moment().add(5, 'seconds').format("YYYY-MM-DD HH:mm:ss");
  console.log(`La ejecución sera el ${nuevaHora}`);
  setInterval(async () => {
    var hora = moment().format("YYYY-MM-DD HH:mm:ss");
    if (hora == nuevaHora) {
      await scrapping();
      console.log(`Ejecución ${nuevaHora}`);
      nuevaHora = moment(new Date(nuevaHora));
      nuevaHora.add(Math.floor(Math.random() * (Math.floor(minutosMaximos) - Math.ceil(minutosMinimos) + 1)) + Math.ceil(minutosMinimos), 'minutes');
      nuevaHora = nuevaHora.format("YYYY-MM-DD HH:mm:ss");
      console.log(`Proxima ejecución ${nuevaHora}`);
    }
  }, 1000);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  Programable
}
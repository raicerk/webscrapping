var cheerio = require('cheerio');
var config = require('./config');
var request = require('request');
const moment = require('moment');
var admin = require("firebase-admin");
var serviceAccount = require("./firebase-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
db.settings({
  timestampsInSnapshots: true
})

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

  let ms = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"].indexOf(req.fecha.split(' ')[0]) + 1;

  let dia = req.fecha.split(' ')[1];
  let mes = ms < 10 ? `0${ms}` : ms;
  let ano = moment().year();
  let id = req.link.split('/')[3];

  try {

    var data = {
      pais: 'CL',
      link: `${config.dominiositio}${req.link}`,
      fecha: `${ano}-${mes}-${dia}`,
      skill: req.skill
    };

    db.collection('programacion').doc(id).set(data);

  } catch (e) {
    console.log(e);
  }
};

exports.ConsultaDatos = function (req, res) {

  db.collection("programacion")
    .orderBy("fecha", "desc")
    .get()
    .then((querySnapshot) => {
      let arr = [];
      querySnapshot.forEach(function (doc) {
        var obj = JSON.parse(JSON.stringify(doc.data()));
        arr.push(obj);
      });

      if (arr.length > 0) {

        var nuevo = [];

        arr.forEach(element => {
          for (i in element.skill) {
            nuevo.push(element.skill[i]);
          }
        });

        var count = {};
        nuevo.forEach(function (i) { count[i] = (count[i] || 0) + 1; });

        res.status(200).jsonp([count]);

      } else {
        res.status(500).jsonp({ results: 'error' });
      }
    })
    .catch((error) => {
      console.log(error)
      res.status(500).jsonp({ results: 'error' });
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

exports.ConsultaDatosPorFecha = function (req, res) {

  meses = [
    "2018-01",
    "2018-02",
    "2018-03",
    "2018-04",
    "2018-05",
    "2018-06",
    "2018-07",
    "2018-08",
    "2018-09",
    "2018-10",
    "2018-11",
    "2018-12",
    "2019-01",
    "2019-02",
    "2019-03",
    "2019-04",
    "2019-05",
    "2019-06",
    "2019-07",
    "2019-08",
    "2019-09",
    "2019-10",
    "2019-11",
    "2019-12",
  ]

  db.collection("programacion")
    .orderBy("fecha", "asc")
    .get()
    .then((querySnapshot) => {
      let arr = [];
      querySnapshot.forEach(function (doc) {
        var obj = JSON.parse(JSON.stringify(doc.data()));
        arr.push(obj);
      });

      if (arr.length > 0) {

        const tercero = []
        const datos = []

        const rawSkills = []
        // Extraccion de topicos
        arr.forEach((entry) => rawSkills.push(...entry.skill))
        // Limpieza de arreglo
        const skills = [...new Set(rawSkills)]

        const output = {}

        skills.map((skill) => {
          output[skill] = [] // Crea la entrada en la salida
          const datoSkill = {}
          arr.forEach((entry) => {
            /** Fecha de evaluacion del ciclo */
            const fecha = entry.fecha.split('-')[0] + '-' + entry.fecha.split('-')[1]
            // Si la entrada en el origen de datos contiene la skill
            if (entry.skill.findIndex((s => s === skill)) !== -1) {
              const dato = datoSkill[fecha]
              // Si el mes existe en datos, agrega 1, si no lo crea con valor 1
              if (dato) {
                datoSkill[fecha] = dato + 1
              } else {
                datoSkill[fecha] = 1
              }
            }
          })
          output[skill] = datoSkill
        })

        res.status(200).jsonp(output);

      } else {
        res.status(500).jsonp({ results: 'error' });
      }
    })
    .catch((error) => {
      console.log(error)
      res.status(500).jsonp({ results: 'error' });
    });
}

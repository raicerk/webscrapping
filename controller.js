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
});

/**
 * Lee sitio web y tabula información
 * return boolean
 */
exports.scrapping = function () {

  console.log("Scrapping iniciado.");

  request(config.sitio, function (error, response, html) {

    if (!error) {

      var $ = cheerio.load(html);

      var count = 1;

      $('.job').filter(function () {

        count = count + 1;

        var data = $(this);
        let obj = [];
        let json = {};

        json.link = data[0].children[0].next.attribs.href;
        json.fecha = data[0].children[0].next.children[7].next.children[0].data.replace(/\n/g, '');

        let me = data.find('.ellipsis .tag');

        for (var i = 0; i < me.length; i++) {
          obj.push(me[i].children[0].data);
        }

        json.skill = obj;

        exports.registro(json);

      });
      console.log("Scrapping finalizado.");
    } else {
      return false;
    }
    return true;
  });
};

/**
 * Almacena información en db de scrapping
 * return void
 */
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
<<<<<<< HEAD
};

exports.ConsultaDatosPorFecha = function (req, res) {

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
        const rawSkills = [];
        // Extraccion de topicos
        arr.forEach((entry) => rawSkills.push(...entry.skill));
        // Limpieza de arreglo
        const skills = [...new Set(rawSkills)];

        const output = {};

        skills.map((skill) => {
          // Crea la entrada en la salida
          output[skill] = [];
          const datoSkill = {};
          arr.forEach((entry) => {
            // Fecha de evaluacion del ciclo
            const fecha = `${entry.fecha.split('-')[0]}-${entry.fecha.split('-')[1]}`;
            // Si la entrada en el origen de datos contiene la skill
            if (entry.skill.findIndex(s => s === skill) !== -1) {
              const dato = datoSkill[fecha];
              // Si el mes existe en datos, agrega 1, si no lo crea con valor 1
              if (dato) {
                datoSkill[fecha] = dato + 1;
              } else {
                datoSkill[fecha] = 1;
              }
            }
          });
          output[skill] = datoSkill;
        });

        res.status(200).jsonp(output);

      } else {
        res.status(500).jsonp({ results: 'error' });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).jsonp({ results: 'error' });
    });
};
=======
};
>>>>>>> develop

var config = require('./config');
var admin = require("firebase-admin");
var serviceAccount = require("./firebase-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
db.settings({
  timestampsInSnapshots: true
});

exports.ConsultaDatos = function (req, res) {

  db.collection("laboral")
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
          for (const i in element.skill) {
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
      console.log(error);
      res.status(500).jsonp({ results: 'error' });
    });
};

exports.ConsultaDatosPorFecha = function (req, res) {

  db.collection("laboral")
    .where(req.params.where,"==",req.params.value)
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

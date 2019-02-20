const graphqlHTTP = require('express-graphql');
const db = require("../controllers/db");
const { buildSchema } = require('graphql');
const router = require("express").Router();

const schema = buildSchema(`

  """Datos estadisticos sobre ofertas laborales y conocimientos requeridos para cada pais en el mundo de la tecnologia"""
  type Query {
    """Datos estadisticos con filtros"""
    estadistica(where: FieldBy, order: OrderBy): [Laboral],
    """Datos estadisticos completos"""
    estadisticas: [Laboral]
    """Datos agrupados por fecha"""
    agrupadoporfecha(where: FieldBy): [Agrupacion]
  }

  input OrderBy {
    by: String
    orientation: String
  }

  input FieldBy{
    field: String,
    value: String
  }

  """Datos de ofertas laborales por año mes y cantidad"""
  type Datos{
    """Año mes del skill"""
    fecha: String
    """Cantidad de ofertas laborales donde el skill es solicitado para la fecha que se indica"""
    cantidad: Int
  }

  """Campos disponibles de las ofertas laborales y por los cuales se puede filtrar"""
  type Laboral {
    """Fecha de la oferta"""
    fecha: String
    "Pais de publicación"
    pais: String
    "Link de acceso"
    link: String
    "Clasificacion de la oferta"
    clasificacion: String
    "Skill requeridos en la oferta"
    skill: [String]
  }

  """Campos disponibles para mostrar datos agrupados"""
  type Agrupacion{
    """Nombre del skill"""
    skill: String
    """Datos agrupados del skill"""
    datos: [Datos]
  }
`);

const root = {
  estadistica: async ({ where, order }) => {
    const snapshot = await db.collection("laboral").where(where.field, "==", where.value).orderBy(order.by, order.orientation).get()
    const { docs } = snapshot;
    const data = docs.map(doc => doc.data())
    return data;
  },
  estadisticas: async () => {
    const snapshot = await db.collection("laboral").get()
    const { docs } = snapshot;
    const data = docs.map(doc => doc.data())
    return data;
  },
  agrupadoporfecha: async ({ where }) => {
    const snapshot = await db.collection("laboral").where(where.field, "==", where.value).get()
    const { docs } = snapshot;
    const data = docs.map(doc => doc.data())

    const rawSkills = [];
    data.forEach((entry) => rawSkills.push(...entry.skill));
    const skills = [...new Set(rawSkills)];
    var iib = [];
    const datoSkill = {};

    skills.map((value) => {

      var dattta = [];

      data.forEach((entry) => {
        // Fecha de evaluacion del ciclo
        const fecha = `${entry.fecha.split('-')[0]}-${entry.fecha.split('-')[1]}`;
        // Si la entrada en el origen de datos contiene la skill
        if (entry.skill.findIndex(s => s === value) !== -1) {

          const dato = datoSkill[fecha];
          // Si el mes existe en datos, agrega 1, si no lo crea con valor 1
          if (dato) {
            datoSkill[fecha] = dato + 1;
          } else {
            datoSkill[fecha] = 1;
          }
        }
      });

      for (var i in datoSkill) {
        dattta.push({
          fecha: i,
          cantidad: datoSkill[i]
        });
      }

      dattta.sort(function (a, b) {
        if (a.fecha < b.fecha) return 1;
        if (a.fecha > b.fecha) return -1;
        return 0;
      });

      iib.push({
        skill: value,
        datos: dattta
      })
    })

    return iib;
  }
};

router.use('/', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true
}));

module.exports = router;
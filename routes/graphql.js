const graphqlHTTP = require('express-graphql');
const db = require("../controllers/db");
const { buildSchema } = require('graphql');
const router = require("express").Router();

const schema = buildSchema(`

  """
  Datos estadisticos sobre ofertas laborales y conocimientos
  requeridos para cada pais en el mundo de la tecnologia
  """
  type Query {
    """Datos estadisticos con filtros"""
    estadistica(where: FieldBy, order: OrderBy): [Laboral],
    """Datos estadisticos completos"""
    estadisticas: [Laboral]
  }

  input OrderBy {
    by: String
    orientation: String
  }

  input FieldBy{
    field: String,
    value: String
  }

  """
  Campos disponibles de las ofertas laborales
  y por los cuales se puede filtrar
  """
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
  }
};

router.use('/', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true
}));

module.exports = router;
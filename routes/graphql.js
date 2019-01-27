const graphqlHTTP = require('express-graphql');
const db = require("../controllers/db");
const { buildSchema } = require('graphql');
const router = require("express").Router();

const schema = buildSchema(`
  type Query {
    datos(where: FieldBy, order: OrderBy): [Laboral]
  }

  input OrderBy {
    by: String
    orientation: String
  }

  input FieldBy{
    field: String,
    value: String
  }

  type Laboral {
    fecha: String
    pais: String
    link: String
    clasificacion: String
    skill: [String]
  }
`);

const root = {
  datos: async ({ where, order }) => {
    const snapshot = await db.collection("laboral").where(where.field, "==", where.value).orderBy(order.by, order.orientation).get()
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
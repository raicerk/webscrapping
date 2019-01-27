const graphqlHTTP = require('express-graphql');
const db = require("../controllers/db");
const { buildSchema } = require('graphql');
const router = require("express").Router();

const schema = buildSchema(`
  type Query {
    skills(pais: String, order: OrderBy): [Laboral]
  }

  input OrderBy {
    by: String
    orientation: String
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
  skills: async ({ pais, order }) => {
    const snapshot = await db.collection("laboral").where("pais", "==", pais).orderBy(order.by, order.orientation).get()
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
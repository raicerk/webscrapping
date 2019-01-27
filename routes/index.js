// const skills = require('./skills');
const graphql = require('./graphql');

/**
 * Registro de rutas
 *
 * @param {Express.Application} app Aplicación de Express
 * @returns {void}
 */
const register = function(app) {
  // app.use('/skills', skills);
  app.use('/graphql', graphql);
};

module.exports = register;

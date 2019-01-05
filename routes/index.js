const skills = require('./skills');

/**
 * Registro de rutas
 *
 * @param {Express.Application} app Aplicación de Express
 * @returns {Express.Application} App
 */
const register = function(app) {
  app.use('/skills', skills);
};

module.exports = register;

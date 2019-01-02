const memcache = require('memory-cache');

/**
 * Middleware para manejo de respuesta de datos.
 *
 * **SÓLO DEBE OCUPARSE EN MÉTODOS GET**
 *
 * @param {Number} seconds En segundos, cuanto vive el recurso caché
 * @returns {Function} Middleware
 */
const cache = function(seconds) {
  return function(req, res, next) {
    const cacheKey = `__cache__${req.originalUrl || req.url}`;
    const cachedBody = memcache.get(cacheKey);
    res.set({
      'Cache-Control': `max-age=${seconds}`
    });
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    res.sendResponse = res.send;
    res.send = (body) => {
      memcache.put(cacheKey, body, seconds * 1000);
      res.sendResponse(body);
    };
    next();
  };
};

module.exports = cache;

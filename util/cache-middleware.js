const memcache = require('memory-cache');

/**
 * Middleware para manejo de respuesta de datos.
 * @param {Number} duration En segundos, cuanto vive el recurso antes de renovar la cache
 * @returns {Function} Middleware
 */
const cache = function(duration) {
  return function(req, res, next) {
    const cacheKey = `__cache__${req.originalUrl || req.url}`;
    const cachedBody = memcache.get(cacheKey);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    res.sendResponse = res.send;
    res.send = (body) => {
      memcache.put(cacheKey, body, duration * 1000);
      res.sendResponse(body);
    };
    next();
  };
};

module.exports = cache;

var rp = require('request-promise');

/**
 * Obtiene el HTML DOM del sitio
 * return string
 */
var obtieneHTML = module.exports.obtieneHTML = function (sitio) {
    return new Promise((resolve, reject) => {
        rp(sitio).then(function (htmlString) {
            resolve(htmlString)
        }).catch(function (err) {
            console.log(err);
            reject(err);
        });
    })
}

var max = module.exports.max = function (saludo) {
    return "holisi" + saludo;
}

module.exports.asyncForEach = async function (array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
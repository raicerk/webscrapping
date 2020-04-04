var rp = require('request-promise');
const config = require('./config');
const axios = require('axios').default;
const cheerio = require('cheerio');

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

module.exports.normalizafecha = StringFecha => {
    let fecha = StringFecha.replace(/ de /g, '-').split("-");
    let meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    let mes = meses.indexOf(fecha[1]) + 1;
    let date = mes < 10 ? "0".concat(mes) : mes;
    let nueva = fecha[2] + "-" + date + "-" + fecha[0]
    return nueva;
}

exports.obtieneLink = async () => {

    return new Promise(async (resolve, reject) => {
        try {

            var data = []
            var promises = []

            config.sitios.forEach(async (item, i) => {
                Object.entries(item.sitios).forEach(async ([clasificacion, link]) => {
                    promises.push(
                        axios.get(link).then(async response => {
                            let $ = cheerio.load(response.data)
                            Object.entries($('.sgb-results-list div a')).forEach(([indice, objeto]) => {
                                if($(objeto).attr("href")){
                                    data = [...data, {
                                        clasificacion: clasificacion,
                                        pais: item.pais,
                                        dominio: item.dominiositio,
                                        link: $(objeto).attr("href")
                                    }]
                                }   
                            })
                        })
                    )
                })
            })
            await Promise.all(promises);
            resolve(data);
        } catch (error) {
            reject(error)
        }
    })
}
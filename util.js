const axios = require('axios').default;
const cheerio = require('cheerio');

const { sitios } = require('./config');

const normalizafecha = StringFecha => {
    let fecha = StringFecha.replace(/ de /g, '-').split("-");
    let meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    let mes = meses.indexOf(fecha[1]) + 1;
    let date = mes < 10 ? "0".concat(mes) : mes;
    let nueva = fecha[2] + "-" + date + "-" + fecha[0]
    return nueva;
}

const obtieneLink = async () => {

    return new Promise(async (resolve, reject) => {
        try {

            var data = []
            var promises = []

            sitios.forEach(async (item, i) => {
                Object.entries(item.sitios).forEach(async ([clasificacion, link]) => {
                    promises.push(
                        axios.get(link).then(async response => {
                            let $ = cheerio.load(response.data)
                            Object.entries($('.sgb-results-list div a')).forEach(([indice, objeto]) => {
                                if ($(objeto).attr("href")) {
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

module.exports = {
    normalizafecha,
    obtieneLink
}
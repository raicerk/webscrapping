var mongoose = require('mongoose'),
  Schema   = mongoose.Schema;

var Ofertas = new Schema({
  link: { type : String, required : true, unique : true },
  fecha: { type : String, required : true },
  skill: { type : Array, required : true }
});

module.exports = mongoose.model('jobdata', Ofertas);

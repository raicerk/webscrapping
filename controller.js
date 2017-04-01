var mongoose = require('mongoose');

var User = mongoose.model('jobdata');

var config = require('./config');

exports.registro = function(req) {

  try {

    var data = new User({
      link  : req.link,
      fecha : req.fecha,
      skill : req.skill
    });

    data.save(function(err,res){
      if (err) {
        console.log("se ha producido un error al almacenar los datos");
      }else{
        console.log("Almacenado correctamente");
        return true;
      }
    });
  }catch (e) {
    console.log(e);
    return false;
  }
};

exports.ConsultaDatos = function(req,res){
  var o = {};
  o.map = function(){
    var datos = JSON.stringify(this.skill).replace(/[\"\]\[]/g,'');
    var skill = datos.split(',');
    for(i in skill){
        emit(skill[i],1);
    }
  }

  o.reduce = function(key,values){

    var count = 0;
    for(i in values){
        count += values[i];
    }
    return count;
  }

  User.mapReduce(o, function (err, results) {
    res.status(200).jsonp(results);
  });
}

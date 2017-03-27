var mongoose = require('mongoose');
var User = mongoose.model('jobdata');
var config = require('./config');

exports.registro = function(req, res) {

  try {

    let data = new jobdata({
      link::    req.body.nombres,
      fecha:     req.body.correo,
      skill:      serv.Ahora()
    });

    var promise = data.save();

    promise.then(function (doc) {
      return res.status(200).jsonp({ok:true});
    })
    .catch(function(err){

      console.log(err);

      if(err.code == 11000){
          return res.status(400).jsonp({ok:false});
      }else {
          return res.status(500).jsonp({ok:false});
      }
    });
  }catch (e) {
    console.log(e);
    return res.status(500).jsonp({ok:false});
  }
};

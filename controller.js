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

    var promise = data.save();

    promise.then(function (doc) {
      return true;
    })
    .catch(function(err){

      console.log(err);

      if(err.code == 11000){
          return false;
      }else {
          return false;
      }
    });
  }catch (e) {
    console.log(e);
    return false;
  }
};

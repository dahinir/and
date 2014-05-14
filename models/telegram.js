var loopback = require('loopback');
var app = require('../app');
var Telegram = app.models.telegram;

var _ = require('underscore');


Telegram.mine = function(condition, fn){
  console.log("telegram/mine");
  console.log(condition);
  if ( typeof condition === 'function'){
    fn = condition;
    condition = undefined;
  }

  var compareVersion = require('compare-version');
// console.log(compareVersion('1.11.3', '1.11.25')); //  -1
// console.log(compareVersion('1.11.3', '1.11.31')); //  -1




  var query = {
    "condition.appVersion.lte": { $gt: condition.appVersion }
  };

  // load all telegram.. hm..
  this.find({where: {}}, function(err, telegrams){
    var defaultError = new Error('telegram find failed');

    if(err) {
      debug('An error is reported from Telegram.findOne: %j', err);
      fn(defaultError);
    } else if(telegrams) {
      // console.log(telegrams);
      var results = [];
      _.each(telegrams, function(tel){
        // lte, gt 조건은 없음!!
        if( compareVersion(tel.condition.appVersion.lt, condition.appVersion) === 1 &&
          compareVersion(tel.condition.appVersion.gte, condition.appVersion) <= 0 &&
          ( !tel.condition.osname || tel.condition.osname == condition.osname) ){
            tel.condition = undefined;
            // delete tel.condition;  // why don't works?
            results.push(tel);
        }
      });
      console.log(results);
      return fn(undefined, {"results":results});
    }
  });

  // return fn(undefined, {"af":1});
};


loopback.remoteMethod(Telegram.mine, {
  "http": {verb: "get"},
  "accepts": [
    {arg: 'condition', type: 'object', required: true}
  ],
  "returns": {
    arg: 'data', type: 'object', root: true
  }
});

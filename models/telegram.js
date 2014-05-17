var loopback = require('loopback');
var app = require('../app');
var Telegram = app.models.telegram;

var _ = require('underscore');


Telegram.mine = function(criteria, fn){
  console.log("telegram/mine");
  console.log(criteria);
  if ( typeof criteria === 'function'){
    fn = criteria;
    criteria = undefined;
  }

  var compareVersion = require('compare-version');
// console.log(compareVersion('1.11.3', '1.11.25')); //  -1
// console.log(compareVersion('1.11.3', '1.11.31')); //  -1




  var query = {
    "criteria.appVersion.lte": { $gt: criteria.appVersion }
  };

  // load all telegrams.. hm..
  this.find({where: {}}, function(err, telegrams){
    var defaultError = new Error('telegram find failed');

    if(err) {
      debug('An error is reported from Telegram.findOne: %j', err);
      fn(defaultError);
    } else if(telegrams) {
      // console.log(telegrams);
      var results = [];
      _.each(telegrams, function(tel){
        // criteria가 복잡해지면 underscore-query를 사용 할 것.
        // lte, gt 조건은 없음!!
        if( compareVersion(tel.criteria.appVersion.lt, criteria.appVersion) === 1 &&
          compareVersion(tel.criteria.appVersion.gte, criteria.appVersion) <= 0 &&
          ( !tel.criteria.osname || tel.criteria.osname == criteria.osname) ){
            tel.criteria = undefined;
            // delete tel.criteria;  // why don't works?
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
    {arg: 'criteria', type: 'object', required: true}
  ],
  "returns": {
    arg: 'data', type: 'object', root: true
  }
});

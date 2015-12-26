var loopback  = require('loopback');

module.exports = function(Push) {

  Push.mine = function(criteria, callback){
    console.log("Push.mine called");
    var note;
    Push.getApp(function(err, app){
      var Notification = app.models.Notification;
      note = new Notification({
          expirationInterval: 3600, // Expires 1 hour from now.
          badge: 23,
          sound: 'ping.aiff',
          alert: '\uD83D\uDCE7 \u2709 ' + ' ha ha',
          messageFrom: 'Ray'
        });
    });
    Push.notifyByQuery({ appId: 'com.dasolute.yotoo', userId: '5592e57c6f9be93752ea496d' }, note,
    function(e){
      console.log("push manage callback called");
      console.log(e);
    });
    return callback(undefined, {"results":{results:"dd"}});

    Push.notifyMany("com.dasolute.yotoo", "ios", ["1e7baad2e4812597c548aa90c547bf05d65cc5d638cee4d8cec93eb24f297e85"], note, function(e){
      console.log("push manage callback called");
      console.log(e);
    });
    return callback(undefined, {"results":{results:"dd"}});

    Push.notifyById(
      // {
      // "appId": "com.dasolute.yotoo",
      // "deviceToken": "1e7baad2e4812597c548aa90c547bf05d65cc5d638cee4d8cec93eb24f297e85"
      // "deviceType": "ios2"
    // }, {
      "56157346bd6d8987a6e76eef",
      note, function(e){
      console.log("push manage callback called");
      console.log(e);
    });

    return callback(undefined, {"results":{results:"dd"}});

    if ( typeof criteria === 'function'){
      callback = criteria;
      criteria = undefined;
    }
    var compareVersion = require('compare-version');

    var query = {
      "criteria.appVersion.lte": { $gt: criteria.appVersion }
    };

    // load all telegrams.. hm..
    this.find({where: {}}, function(err, telegrams){
      var defaultError = new Error('telegram find failed');

      if(err) {
        debug('An error is reported from Telegram.findOne: %j', err);
        callback(defaultError);
      } else if(telegrams) {
        // console.log("telegram:" + telegrams.length);
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
        // console.log(results);
        return callback(undefined, {"results":results});
      }
    });
  };

  Push.remoteMethod("mine", {
      "http": {verb: "get"},
      "accepts": [
        {arg: 'criteria', type: 'object', required: false}
      ],
      "returns": {
        arg: 'data', type: 'object', root: true
      }
  });

};

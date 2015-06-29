module.exports = function(Customer) {
  var app = require('../../server/server');

  console.log("[customer.js] init");

  Customer.observe('access', function logQuery(ctx, next) {
    console.log("ahsdfhawielnca;sasdd=====");
    console.log(ctx );
    // console.log('Accessing %s matching %s', ctx.Model.modelName, ctx.query.where);
    next();
  });

  // 사용하지 않음. 그냥 테스트
  Customer.externalAccounts = function(userId, callback){
    var credentials = [];
    console.log("arg:" + userId);
    // console.log(Customer.__get__identities());

    console.log("---");
    // console.log(Customer.app.models.CustomerCredential);
    // console.log("req.user:" );
    // console.log("this:" + JSON.stringify(Object.getOwnPropertyNames(Customer)) );

    Customer.findById(userId, function(err, customer) {
      console.log(customer);
      // customer.app.models.CustomerIdentity.author(function(){
      //   console.log(arguments);
      // });

      // if (err) return callback(err);
      // if (project.balance >= amount) {
      //   project.balance -= amount;
      // }
      // else {
      //   project.balance = 0;
      // }
      // project.save();

      // console.log(customer);
      // callback(null, customer);
    });

    return callback(undefined, {"results": credentials});
  };

  Customer.remoteMethod("externalAccounts", {
    "http": { verb: "get"},
    "accepts": [
      {
        arg: 'access_token',
        type: 'string',
        required: true,
        http: function(ctx){
          console.log(ctx.req.accessToken.userId);
          // console.log(ctx.req);
          console.log(app.models.AccessToken.findForRequest(ctx.req));
          console.log("--------------");
          // console.log(Customer);
          return ctx.req.accessToken.userId;
        },
        description: 'Do not supply this argument, it is automatically extracted ' +
          'from request headers. -by dahinir'
      }
    ],
    "returns": {
      arg: 'data', type: 'object'//, root: false
    }
  });

};


/* OLD SOURCE

// http://docs.strongloop.com/display/DOC/Exposing+models+over+a+REST+API

var loopback = require('loopback');
var app = require('../app');
var User = app.models.user;

// fb's long-lived token generally lasts about 60days
var fbgraph = require('fbgraph');
// fbgraph.setAccessToken("191723324370677");
// 4e4b5aaef0f9e457ab236af87d03b4c1
// fbgraph.setAccessToken("CAACuXxCk7vUBAK9jyFctBrRkniM84mCevlcMG1eN6dZBZBc8IBOSZCcFWMs13YPs7dSOBYvRRrZBjFGiSALR8rGQvXUHzK8oYEEVeJ8OUZAKhnEZBRRqnsjIXqNsiiKV1yc53ehPhWTgK37MFFMLOuF1obtIcqLVT3epQLNjCIxkLyxioZCd6XT1ermFdbMxfvEWZB6cKBnsdwZDZD");
// fbgraph.setAccessToken("CAAHnlYnnClcBANZCLLd140q9JgagpWbRL5ZCBwCKbZC1hvupXeDfIlhEaE0BYYM3mfZAQFcXa5lTkatPb4BW1lToyz9jVFoRm8wQO7ZCGDlUZBHN5tDk9hLWpGzP2Qnj0HNJQhJHU6O8H138D4ZB9DKsZAW5gSvFRj3HDvvZCacpXWW2ce5fgKE7BfS9AEc3aFpzLG8MV4N6TtYgetH1r03Dp");
// fbgraph.get("zuck", function(err, res) {
//   console.log(res); // { id: '4', name: 'Mark Zuckerberg'... }
// });


// var FB = require('fb');
// // https://developers.facebook.com/docs/facebook-login/access-tokens/
// FB.api('oauth/access_token', {
//     // client_id: '191723324370677',  // licky dev
//     // client_secret: '4e4b5aaef0f9e457ab236af87d03b4c1',
//     client_id: '536104426474071',    // licky product
//     client_secret: '9c8602bf85abfeb698f02ab7c6ebc34a',
//     grant_type: 'fb_exchange_token',
//     fb_exchange_token: 'CAAHnlYnnClcBAL8ZCZBqI0qWrQoIAkdH7M5YBRZAadNMLAkyTPaqIpE1Ty5Gs0yLK7XqDzojf4AqXHx6mme2Nss4NqnecKl9llAZBD34fFno31ASh1q5IfLxFLqXZCSq81LDZB9hFaZBg4blYVEIlu0UCvn62EMFFWQ8IVn5cuZBPp5XZB2OCEcYs'
// }, function (res) {
//     console.log(res);
//
//     if(!res || res.error) {
//         if(res.error.code == 190){
//           if( res.error.error_subcode == 467){
//             // Error validating access token: The session is invalid because the user logged out.
//             console.log("need login again");
//           }
//         }
//         // console.log(!res ? 'error occurred' : res.error);
//         return;
//     }
//
//     var accessToken = res.access_token;
//     var expires = res.expires ? res.expires : 0;
// });


// A remote method must accept a callback with the conventional fn(err, result, ...) signature.
User.externalAccountLogin = function(credentials, include, fn){
  console.log("external account login");
  if (typeof include === 'function') {
    fn = include;
    include = undefined;
  }

  include = (include || '').toLowerCase();

  var query = {};
  if(credentials.email) {
    query.email = credentials.email;
  } else if(credentials.username) {
    query.username = credentials.username;
  } else {
    var err = new Error('username or email is required');
    err.statusCode = 400;
    return fn(err);
  }

  this.findOne({where: query}, function(err, user) {
    var defaultError = new Error('external login failed');

    if(err) {
      debug('An error is reported from User.findOne: %j', err);
      fn(defaultError);
    } else if(user) {
      // user.hasPassword(credentials.password,)
    }
  });



  // var err, result = {"hah":"asdf"};
  // return fn(err, result);
};


// expose method to clients
loopback.remoteMethod(User.externalAccountLogin, {
  "http": {verb: 'post'},
  "accepts": [
    {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}},
    {arg: 'include', type: 'string', http: {source: 'query' } }
  ],
  "returns": {
    arg: 'accessToken', type: 'object', root: true
  }
});
*/

module.exports = function(CustomerIdentity) {
  // var app = require('../../server/server');


  CustomerIdentity.findOneForRequest = function(req, callback){
    var userId;
    if(req.accessToken && req.accessToken.userId){
      userId = req.accessToken.userId;
    }else{
      return callback({"what":"there is no user id"});
    }
    // console.log(userId);
    CustomerIdentity.findOne({"where":{"userId":userId}}, function(err, customerIdentity) {
      // console.log(JSON.stringify(customerIdentity));
      return callback(err, customerIdentity);
    });

  };

  CustomerIdentity.remoteMethod("findOneForRequest", {
    "http": { verb: "get"},
    "accepts": [
      {
        arg: 'access_token',
        type: 'string',
        required: true,
        http: function(ctx){
          // var userId = "ThereIsNoUserId";
          // if(ctx.req.accessToken && ctx.req.accessToken.userId)
          //   userId = ctx.req.accessToken.userId;
          return ctx.req;
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

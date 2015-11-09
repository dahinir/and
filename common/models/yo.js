var loopback  = require('loopback');
// var request = require("request");
module.exports = function(Yo) {
  // Yo.validate('name', customValidator, {message: 'Bad name'});
  // function customValidator(err) {
  //   console.log("=====validate--====");
  //   console.log(arguments);
  //   console.log("====this===");
  //   console.log(this);
    // console.log("---context----");
    // var context = loopback.getCurrentContext();
    // console.log(context.active.accessToken);

    // Yo.getApp(function(err, app){
      // app.models.UserIdentity.find
    // });

    // err();
    //   if (this.name === 'bad') err();
  // };
  // Yo.validate("duplicated",);


/*
  // The before save hook is triggered before a model instance is about to be modified (created, updated). The hook is triggered before the validation.
  Yo.observe('before save', function (ctx, next) {
    console.log("[yo.js] before save");
    delete ctx.Model;
    console.log(ctx);
    console.log("context");
    var context = loopback.getCurrentContext();
    console.log(context);
    // Full save of a single model
    if (ctx.instance) {
      // console.log(ctx.inst/ance);
      // ctx.Model.findById(userId, function(err, customer) {}
      // ctx.instance.percentage = 100 * ctx.instance.part / ctx.instance.total;
    // Partial update of possibly multiple models
    } else if (ctx.data) {
      // console.log(ctx.data)
      // ctx.data.percentage = 100 * ctx.data.part / ctx.data.total;
    }
    next();
  });
*/
  Yo.beforeRemote("find", function(ctx, modelInstance, next){
    console.log("[yo.js] beforeRemote find");
    if(!ctx.req.accessToken.userId || !ctx.req.remotingContext.args){
      next(new Error("what r u doin?"));
      return;
    }
    var filter = ctx.req.remotingContext.args.filter?
          JSON.parse(ctx.req.remotingContext.args.filter):
          {"where":{}};
    filter.where.userId = ctx.req.accessToken.userId;
    ctx.req.remotingContext.args.filter = filter;
    next();
    return;
  });

  Yo.observe('before save', function (ctx, next) {
    console.log("[yo.js] before save");
    // console.log(ctx.instance);
    // console.log("---ctx.data---");
    // console.log(ctx.data);
    next();
  });
  Yo.beforeRemote('create', function(ctx, modelInstance, next){
    console.log("[yo.js] beforeRemote create");
    // console.log(ctx);
    // console.log("modelInstance");
    // console.log(modelInstance);
    // console.log("ctx.req.body");
    // console.log(ctx.req.body);
    // console.log("ctx.req.accessToken");
    // console.log(ctx.req.accessToken);
    var accessToken = ctx.req.accessToken,
      requestBody = ctx.req.body;
    if(!accessToken || !requestBody){
      next(new Error("noway~"));
      return;
    }

    Yo.getApp(function(err, app){
      app.models.UserIdentity.findOne({where: {
        userId: accessToken.userId,
        externalId: requestBody.senderId,
        "profile.provider": requestBody.provider
      }}, function(err, userIdentity){
        console.log("---userIdentities-----");
        // console.log(userIdentity);
        // console.log(err);
        // console.log(accessToken.userId);
        if(!userIdentity){
          next(new Error("what are you doing?"));
          return;
        }

        Yo.findOne({where:{
            provider: requestBody.provider,
            senderId: requestBody.senderId,
            receiverId: requestBody.receiverId
          }}, function(err, yo){
          // console.log("err: " + JSON.stringify(err));
          // console.log("yt: "+ JSON.stringify(yt));
          if(yo){
            // error if yo is exist
            next(new Error("already exist yo"));
          }else{
            // success!
            requestBody.userId = accessToken.userId;
            requestBody.created = new Date();
            next();
          }
          return;
        });
      });
    });
  });
  // Yo.create = function(){
  //   console.log("ahsdfoaiwuhe");
  // };
  Yo.withdraw = function(id, amount, cb) {
    console.log("withdraw!");
    console.log(id);
    console.log("withdraw!");
    cb(null, true);
  };
  Yo.remoteMethod('withdraw', {
    accepts: [
      {arg: 'id', type: 'string'},
      {arg: 'amount', type: 'number'},
    ],
    returns: {arg: 'success', type: 'boolean'},
    http: {path:'/withdraw', verb: 'post'}
  });
};

var loopback  = require('loopback');
// var request = require("request");
module.exports = function(Yotoo) {
  // Yotoo.validate('name', customValidator, {message: 'Bad name'});
  // function customValidator(err) {
  //   console.log("=====validate--====");
  //   console.log(arguments);
  //   console.log("====this===");
  //   console.log(this);
    // console.log("---context----");
    // var context = loopback.getCurrentContext();
    // console.log(context.active.accessToken);

    // Yotoo.getApp(function(err, app){
      // app.models.UserIdentity.find
    // });

    // err();
    //   if (this.name === 'bad') err();
  // };
  // Yotoo.validate("duplicated",);


/*
  // The before save hook is triggered before a model instance is about to be modified (created, updated). The hook is triggered before the validation.
  Yotoo.observe('before save', function (ctx, next) {
    console.log("[yotoo.js] before save");
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
  Yotoo.beforeRemote("find", function(ctx, modelInstance, next){
    console.log("[yotoo.js] beforeRemote find");
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

  Yotoo.observe('before save', function (ctx, next) {
    console.log("[yotoo.js] before save");
    // console.log(ctx.instance);
    // console.log("---ctx.data---");
    // console.log(ctx.data);
    next();
  });
  Yotoo.beforeRemote('create', function(ctx, modelInstance, next){
    console.log("[yotoo.js] beforeRemote create");
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

    Yotoo.getApp(function(err, app){
      app.models.UserIdentity.find({where: {userId: accessToken.userId}}, function(err, userIdentities){
        console.log("---userIdentities-----");
        // console.log(userIdentities);
        // console.log(accessToken.userId);
        var userIdentity;
        while( userIdentity = userIdentities.pop()){
          // console.log(userIdentity);
          if((userIdentity.externalId == requestBody.senderId)
            && (userIdentity.profile.provider == requestBody.provider)){

              Yotoo.findOne({where:{
                  provider: requestBody.provider,
                  senderId: requestBody.senderId,
                  receiverId: requestBody.receiverId
                }}, function(err, yt){
                // console.log("err: " + JSON.stringify(err));
                // console.log("yt: "+ JSON.stringify(yt));
                if(yt){
                  // error if yotoo is exist
                  next(new Error("already exist yotoo"));
                }else{
                  // success!
                  requestBody.userId = accessToken.userId;
                  requestBody.created = new Date();
                  next();
                }
              });
              return;
          }
        }
        next(new Error("what are you doing?"));
        return;
      });
    });

  });
  // Yotoo.create = function(){
  //   console.log("ahsdfoaiwuhe");
  // };
  Yotoo.withdraw = function(id, amount, cb) {
    console.log("withdraw!");
    console.log(id);
    console.log("withdraw!");
    cb(null, true);
  };
  Yotoo.remoteMethod('withdraw', {
    accepts: [
      {arg: 'id', type: 'string'},
      {arg: 'amount', type: 'number'},
    ],
    returns: {arg: 'success', type: 'boolean'},
    http: {path:'/withdraw', verb: 'post'}
  });
};

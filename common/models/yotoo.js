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
        // console.log("---userIdentities-----");
        // console.log(userIdentities);
        var userIdentity;
        while( userIdentity = userIdentities.pop()){
          // console.log(userIdentity);
          if((userIdentity.externalId == requestBody.senderId)
            && (userIdentity.profile.provider == requestBody.provider)){
              // console.log("yotoo success!!");

              Yotoo.destroyAll({
                  provider: requestBody.provider,
                  senderId: requestBody.senderId,
                  receiverId: requestBody.receiverId
                }, function(err, info){
                // console.log("err:" +err);
                // console.log(info);
                // console.log("count:"+info.count);
                requestBody.customerId = accessToken.userId;
                requestBody.created = new Date();
                // success!
                next();
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
};

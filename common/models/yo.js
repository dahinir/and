var loopback  = require('loopback');

module.exports = function(Yo) {
  var app = require('../../server/server');

  // authentication
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

  Yo.beforeRemote("findById", function(ctx, modelInstance, next){
    console.log("[yo.js] beforeRemote findById");
    next();
  });
  // should work "destroyById" but aliases not working
  Yo.beforeRemote("deleteById", function(ctx, modelInstance, next){
    console.log("[yo.js] beforeRemote deleteById");
    next();
  });

  Yo.observe('before save', function (ctx, next) {
    console.log("[yo.js] before save");
    console.log(ctx.instance);
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
        // console.log(err);
        if(!userIdentity){
          next(new Error("what are you doing?"));
          return;
        }
        // find exist Yo
        Yo.findOne({
          where:{
            provider: requestBody.provider,
            senderId: requestBody.senderId,
            receiverId: requestBody.receiverId
          }},
          function(err, yo){
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
  }); // end of Yo.beforeRemote()

  // NOTHING
  Yo.observe("after save", function (ctx, next) {
    console.log("[yo.js] after save");
    console.log(ctx.instance);
    console.log(JSON.stringify(ctx.instance));
    // console.log("---ctx.data---");
    // console.log(ctx.data);

    if(ctx.instance.unyo){
      console.log("[yo.js] unyo! " + ctx.instance.unyo);
    }else{
      console.log("[yo.js] yo! with unyo: " + ctx.instance.unyo);
    }
    next();
  });

  Yo.afterRemote("delete", function(){
    console.log("[yo.js] afterRemote delete.");
    // delete VeiledCompleteYo
    app.models.VeiledCompleteYo.findOne()
  });

  Yo.afterRemote("create", function(ctx, yoInstance, next){
    console.log("[yo.js] afterRemote create. one!");

    // Persist `CompleteYo` and `VeiledCompleteYo` if this yo is mutual.
    Yo.findOne({
      where:{
        provider: yoInstance.provider,
        senderId: yoInstance.receiverId,
        receiverId: yoInstance.senderId
      }},
      function(err, yo){
        if(yo){
          console.log("[yo.js] there is mutual yo!");
          var mutualYo = {
            provider: yoInstance.provider,
            senderId: yoInstance.receiverId, // first yoed provider id
            receiverId: yoInstance.senderId,
            userId1: yo.userId, // first yoed customer id
            userId2: yoInstance.userId
          };
          // Persist CompleteYo for history of this service.
          app.models.CompleteYo.create(mutualYo, function(err, completeYo){
            if (err){
              console.log("[yo.js] ERROR when create CompleteYo!");
              console.log(err);
            }else{
              console.log("[yo.js] created CompleteYo.");
            }
          });
          // Persist VeiledCompleteYo for notify: will removed when notify
          app.models.VeiledCompleteYo.create(mutualYo, function(err, veiledCompleteYo){
            if (err){
              console.log("[yo.js] ERROR when create VeiledCompleteYo!");
              console.log(err);
            }else{
              console.log("[yo.js] created VeiledCompleteYo.");
            }
          });
        }else{
          console.log("[yo.js] there is no mutual yo..");
        }
    });
    next();
    console.log("[yo.js] afterRemote create. one end");
  });

  Yo.afterRemote("create", function(ctx, yoInstance, next){
    console.log("[yo.js] afterRemote create. two!");

    // Send notification "somebody got yo!" for every created Yo.
    // NOT ABOUT `completeYo`
    app.models.UserIdentity.findOne({where: {
      externalId: yoInstance.receiverId,
      "profile.provider": yoInstance.provider
    }}, function(err, userIdentity){
      console.log("[yo.js] yeah!");
      if(userIdentity){ // receiver has account
        console.log("[yo.js] recevier has a account of this service.");
        var Notification = app.models.Notification;
        var Push = app.models.Push;
        notification = new Notification({
          alert: userIdentity.profile.username + " gots yo!"  // needs i18n
          // expirationInterval: 3600, // Expires 1 hour from now.
          // badge: 23,
          // sound: 'ping.aiff',
          // messageFrom: 'Ray'
        });
        Push.notifyByQuery({
          appId: "com.dasolute.yotoo",
          userId: userIdentity.userId
        }, notification,
        function(e){
          console.log("[yo.js] push notification has sent.");
        });
      }else{  // receiver has not account
        // send some twitter mention to the receiver
        console.log("[yo.js] recevier has not account of this service.");
      }
    });

    next();
    console.log("[yo.js] afterRemote create. two end");
  }); // End of Yo.afterRemote("create", function(ctx, yoInstance, next){

};

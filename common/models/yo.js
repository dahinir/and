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
    console.log("[yo.js] beforeRemote create 1");
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

    // validate request: must exist that userIdentity with `userId`, `externalId`, `profile.provider`
    Yo.getApp(function(err, app){
      app.models.UserIdentity.findOne({where: {
        userId: accessToken.userId,
        externalId: requestBody.senderId,
        "profile.provider": requestBody.provider
      }}, function(err, userIdentity){
        if(!userIdentity){
          next(new Error("what are you doing?"));
          return;
        }
        // success!
        requestBody.userId = userIdentity.userId;
        requestBody.created = new Date();
        next();
      });
    });
  }); // end of Yo.beforeRemote()
  Yo.beforeRemote("create", function(ctx, modelInstance, next){
    console.log("[yo.js] beforeRemote create 2");
    var userId = ctx.req.accessToken.userId,
      receiverId = ctx.req.body.receiverId,
      provider = ctx.req.body.provider;

    // remove duplication Yo if exist
    Yo.getApp(function(err, app){
      app.models.Yo.findOne({where:{
        userId: userId,
        receiverId: receiverId,
        provider: provider
      }}, function(err, yo){
        yo && yo.destroy();
        next();
      });
    });
  });

  // NOTHING
  Yo.observe("after save", function (ctx, next) {
    console.log("[yo.js] after save");
    console.log(ctx.instance);
    console.log(JSON.stringify(ctx.instance));
    // console.log("---ctx.data---");
    // console.log(ctx.data);

    if(!ctx.instance){
      console.log("[yo.js] this is internal call maybe?");
      next();
      return;
    }
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
    next(); // call next() first for better response

// if opponent user has yos more than 1,000 remove oldest yo.

    // Persist `CompleteYo` and `VeiledCompleteYo` if there is opponentYo
    Yo.findOne({
      where:{
        provider: yoInstance.provider,
        senderId: yoInstance.receiverId,
        receiverId: yoInstance.senderId
      }},
      function(err, opponentYo){
        if(opponentYo){
          console.log("[yo.js] there is mutual yo!");
          var now = new Date();

          // Persist CompleteYo(mutual yo) for history of this service.
          app.models.CompleteYo.create({
            provider: yoInstance.provider,
            aId: yoInstance.receiverId, // first yoed provider id
            bId: yoInstance.senderId,
            created: now
          }, function(err, completeYo) {
            if (err) {
              console.log("[yo.js] ERROR when create CompleteYo!");
              console.log(err);
            } else {
              console.log("[yo.js] created CompleteYo.");
            }
          });

          // Persist VeiledCompleteYo for notify: will removed when notify
          app.models.VeiledCompleteYo.create({
            provider: yoInstance.provider,
            aId: yoInstance.receiverId, // first yoed provider id
            bId: yoInstance.senderId,
            aUserId: opponentYo.userId, // aId and aUserId is same person
            bUserId: yoInstance.userId,
            created: now
          }, function(err, veiledCompleteYo){
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
    console.log("[yo.js] afterRemote create. one end");
  });

  Yo.afterRemote("create", function(ctx, yoInstance, next){
    console.log("[yo.js] afterRemote create. two!");
    next(); //call next() first for better response

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
        }, notification, function(e){
          console.log("[yo.js] push notification has sent.");
        });
      }else{  // receiver has not account
        // send some twitter mention to the receiver
        console.log("[yo.js] recevier has not account of this service.");
      }
    });
    console.log("[yo.js] afterRemote create. two end");
  }); // End of Yo.afterRemote("create", function(ctx, yoInstance, next){

};

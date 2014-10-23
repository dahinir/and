"use strict";

var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();

var path = require('path');
var started = new Date();

console.log("======");
console.log(app.get('env'));
console.log("======");

// Set up the /favicon.ico
app.use(loopback.favicon());

// request pre-processing middleware
app.use(loopback.compress());

// -- Add your pre-processing middleware here --

// boot scripts mount components like REST API
boot(app, __dirname);


/*
 * 2. Configure request preprocessing
 *
 *  LoopBack support all express-compatible middleware.
 *
app.use(loopback.logger(app.get('env') === 'development' ? 'dev' : 'default'));
app.use(loopback.cookieParser(app.get('cookieSecret')));
app.use(loopback.token({model: app.models.accessToken}));
app.use(loopback.bodyParser());
app.use(loopback.methodOverride());
*/

/*
 * EXTENSION POINT
 * Add your custom request-preprocessing middleware here.
 * Example:
 *   app.use(loopback.limit('5.5mb'))
 */

/*
 * 3. Setup request handlers.
 *
// LoopBack REST interface
app.use(app.get('restApiRoot'), loopback.rest());

// API explorer (if present)
try {
  var explorer = require('loopback-explorer')(app);
  app.use('/explorer', explorer);
  app.once('started', function(baseUrl) {
    console.log('Browse your REST API at %s%s', baseUrl, explorer.route);
  });
} catch(e){
  console.log(
    'Run `npm install loopback-explorer` to enable the LoopBack explorer'
  );
}
*/

/*
 * EXTENSION POINT
 * Add your custom request-handling middleware here.
 * Example:
 *   app.use(function(req, resp, next) {
 *     if (req.url == '/status') {
 *       // send status response
 *     } else {
 *       next();
 *     }
 *   });
 */

// Let express routes handle requests that were not handled
// by any of the middleware registered above.
// This way LoopBack REST and API Explorer take precedence over
// express routes.
// app.use(app.router);

// -- Mount static files here--
// All static middleware should be registered at the end, as all requests
// passing the static middleware are hitting the file system
// Example:
//   var path = require('path');
//   app.use(loopback.static(path.resolve(__dirname, '../client')));
var websitePath = path.resolve(__dirname, '../client');
app.use(loopback.static(websitePath));

// Requests that get this far won't be handled
// by any middleware. Convert them into a 404 error
// that will be handled later down the chain.
app.use(loopback.urlNotFound());



/*
 * EXTENSION POINT
 * Add your custom error reporting middleware here
 * Example:
 *   app.use(function(err, req, resp, next) {
 *     console.log(req.url, ' failed: ', err.stack);
 *     next(err);
 *   });
 */
// The ultimate error handler.
app.use(loopback.errorHandler());

////////////////////////////////////

/*
 * 5. Add a basic application status route at the root `/`.
 *
 * (remove this to handle `/` on your own)
 */

app.get('/', loopback.status());

/*
 * 6. Enable access control and token based authentication.
 */

var swaggerRemote = app.remotes().exports.swagger;
if (swaggerRemote) swaggerRemote.requireToken = false;

app.enableAuth();

/*
 * 7. Optionally start the server
 *
 * (only if this module is the main module)
 */

app.start = function() {
  return app.listen(function() {
    var baseUrl = 'http://' + app.get('host') + ':' + app.get('port');
    app.emit('started', baseUrl);
    console.log('LoopBack server listening @ %s%s', baseUrl, '/');
    // app.models.application.findById("com.dasolute.yotoo", function(err, instance){
    //   console.log(JSON.stringify(instance));
    // });
    // app.models.applicationVersion.findById("536e56bd7482750000c4bc54", function(err, instance){
    //   console.log(JSON.stringify(instance));
    //   console.log(JSON.stringify(instance.application()));
    //
    //   instance.application(function(err,app){
    //     console.log(JSON.stringify(app));
    //   });
    // });
  });
};


/* noti start */
var Notification = app.models.notification;
var Application = app.models.application;
var PushModel = app.models.push;

function startPushServer() {
// Add our custom routes
  var badge = 1;
  app.post('/notify/:id', function (req, res, next) {
    var note = new Notification({
      // expirationInterval: 3600, // Expires 1 hour from now.
      badge: badge++,
      sound: 'ping.aiff',
      // alert: '\uD83D\uDCE7 \u2709 ' + 'Hello',
      alert: "t:"+ Date.now()
      // messageFrom: 'Ray'
    });

    PushModel.notifyById(req.params.id, note, function (err) {
      if (err) {
        console.error('Cannot notify %j: %s', req.params.id, err.stack);
        next(err);
        return;
      }
      console.log('.....pushing notification to %j', req.params.id);
      res.send(200, 'OK');
    });
  });

  PushModel.on('error', function (err) {
    console.error('Push Notification error: ', err.stack);
  });

// Pre-register an application that is ready to be used for testing.
// You should tweak config options in ./config.js
  var config = require('./config');
  var demoApp = {
    id: 'com.dasolute.yotoo',
    userId: 'dahini@dasolute.com',
    name: config.appName,

    description: 'LoopBack Push Notification Demo Application',
    pushSettings: {
      apns: {
        certData: config.apnsCertData,
        keyData: config.apnsKeyData,
        // key: 'cre/key.pem',
        // cert: 'cre/cert.pem',
        production: false,
        pushOptions: {
          port: 2195  //
          // Extra options can go here for APN
        },
        feedbackOptions: {
          batchFeedback: true,
          interval: 300
        }
      },
      gcm: {
        serverApiKey: config.gcmServerApiKey
      }
    }
  };

  updateOrCreateApp(function (err, appModel) {
    if (err) throw err;
    console.log('Application id: %j', appModel.id);
  });

//--- Helper functions ---
  function updateOrCreateApp(cb) {
    Application.findOne({
        where: { name: demoApp.name }
      },
      function (err, result) {
        if (err) cb(err);
        if (result) {
          console.log('Updating application: ' + result.id);
          // console.log(result.pushSettings.apns.certData);
          // console.log('demoApp:'+ JSON.stringify(demoApp));
          // result.updateAttributes(demoApp, cb);
          // console.log('demoApp:'+ JSON.stringify(result));
        } else {
          return registerApp(cb);
        }
      });
  }
  function registerApp(cb) {
    console.log('Registering a new Application...');
    // Hack to set the app id to a fixed value so that we don't have to change
    // the client settings
    Application.beforeSave = function (next) {
      if(this.name === demoApp.name) {
        this.id = 'com.dasolute.yotoo';
      }
      next();
    };
    Application.register(
      demoApp.userId,  // 'put your developer id here',
      demoApp.name, //'put your unique application name here',
      {
        description: demoApp.description,
        pushSettings: demoApp.pushSettings
      },
      function (err, app) {
        if (err){
          console.log(" register app error");
          return cb(err);
        }
        console.log(" register app success");
        return cb(null, app);
      }
    );
  }
}
// startPushServer();
/* noti end */

if(require.main === module) {
  app.start();
}

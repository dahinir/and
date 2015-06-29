"use strict";

var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();

var path = require('path');
var started = new Date();

// Passport configurators..
var loopbackPassport = require('loopback-component-passport');
var PassportConfigurator = loopbackPassport.PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);

var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;


console.log("======");
console.log(app.get('env'));
console.log("------");


// Set up the /favicon.ico
app.use(loopback.favicon());

// request pre-processing middleware
app.use(loopback.compress());

// http://docs.strongloop.com/display/public/LB/Using+current+context
// app.use(loopback.context());

// The access token is only available after boot
// but in 'http://docs.strongloop.com/display/public/LB/Making+authenticated+requests'
// To use cookies for authentication, add the following to server.js (before boot):
// http://apidocs.strongloop.com/loopback/#loopback-token
// [req.accessToken] will attached by rest-api.js NOT THIS.
// [req.signedCookies.access_token] will atached
app.use(loopback.token({
	// cookies: ['authorization'],
	// headers: ['authorization', 'X-Access-Token'],
	// params: ['access_token'],
	model: app.models.CustomerAccessToken
}));

// -- Add your pre-processing middleware here --
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// just for test
var reqCallCount = 0;
app.get('*', function(req, res, next){
	console.log("===================="+ ++reqCallCount +": "+ req.hostname + req.path);
	console.log("[server.js] req.headers ---" );
	console.log(req.headers);

	console.log("[server.js] req.signedCookies ---");
	console.log(req.signedCookies);

	next();
});


/*
 * Time To Boot Scripts!
 */
// boot scripts mount components like REST API
boot(app, __dirname);


/*
* body-parser is a piece of express middleware that
*   reads a form's input and stores it as a javascript
*   object accessible through `req.body`
*/
var bodyParser = require('body-parser');
// to support JSON-encoded bodies
app.use(bodyParser.json());
// to support URL-encoded bodies
app.use(bodyParser.urlencoded({
	extended: true
}));


// Enable http session
app.use(loopback.cookieParser(app.get('cookieSecret')));

// be sure to use express.session() before passport.session()
// to ensure that the login session is restored in the correct order.
// http://passportjs.org/guide/configure/
// [req.session] attach!
app.use(loopback.session({
	secret: 'kittycat',
	saveUninitialized: true,
	resave: true
}));


/*
 * passport
 */
passportConfigurator.init();

passportConfigurator.setupModels({
	userModel: app.models.Customer,
	userIdentityModel: app.models.CustomerIdentity,
	userCredentialModel: app.models.CustomerCredential
});

// attempt to build the providers/passport config
var passportConfig = {};
try {
  passportConfig = require('../credentials/providers.json');
} catch (err) {
  console.trace(err);
  process.exit(1); // fatal
}

for (var s in passportConfig) {
	var c = passportConfig[s];
	c.session = c.session !== false;
	// console.log("sex:"+ c.session);
	passportConfigurator.configureProvider(s, c);
}



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



////////////////////////////////////
// app.get(function(req, res, next){
// 	console.log("asdfasdfasdf");
// 	console.log(req.session);
// });
/*
 * 5. Add a basic application status route at the root `/`.
 *
 * (remove this to handle `/` on your own)
 */
app.get('*', function(req, res, next){
	console.log("[server.js] req.session ---");
	console.log(req.session);

	console.log("[server.js] req.user ---");
	console.log(req.user);
	console.log("----------------end-" + reqCallCount +": "+ req.hostname + req.path);
	next();
});
app.get('/status', loopback.status());

// expose logined self profile
app.get('/auth/account', ensureLoggedIn('/passport/login.html'), function(req, res, next) {
	// should forward "/twitter/1643461" or "facebook/63441324" "/twitter/dahinir"같은건 추후 지원
  res.render('loginProfiles', {user: req.user});
});
app.get('/auth/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});
app.get('/auth/success', ensureLoggedIn('/passport/login.html'), function(req, res){
	// 로긴 시도 전 페이지가 리퀘스트에 있으면 그쪽으로, 없으면 그냥 프로필 페이지로 포워딩하는 코드 필요.
	// http://stackoverflow.com/questions/18136323/forward-request-to-alternate-request-handler-instead-of-redirect
	res.render('loginSuccess', {
		user: req.user,
		accessToken: req.signedCookies.access_token
	});
});
app.get('/auth/accessToken', function(req, res){
	// req.signedCookies.access_token
});




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
app.use(loopback.static( path.resolve(__dirname, '../client') ));

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

/*
 * 6. Enable access control and token based authentication.
 */

// var swaggerRemote = app.remotes().exports.swagger;
// if (swaggerRemote) {
// 	console.log("swaggerRemote!!");
// 	swaggerRemote.requireToken = false;
// }else{
// 	console.log("none swaggerRemote. maybe loopback 1.xx??");
// }

// move to boot/authentication.js
// app.enableAuth();

/*
 * 7. Optionally start the server
 *
 * (only if this module is the main module)
 */

app.start = function() {
	console.log("app.start ");
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
		// app.models.Customer.hasMany('chapters', {model: app.models.CustomerIdentity});
		// app.models.Customer.hasMany(app.models.AccessToken, {as: 'identy', foreignKey: 'userId'});

		// console.log(app.models);
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

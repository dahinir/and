"use strict";

var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();

var path = require('path');
var started = new Date();

// Passport configurators..
var PassportConfigurator =require('loopback-component-passport').PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);

var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

console.log("========");
console.log(app.get('env'));
console.log("------");



// TODO: Upgrading applications to use phases
// http://docs.strongloop.com/display/public/LB/Upgrading+applications+to+use+phases
//
// Set up the /favicon.ico
// app.use(loopback.favicon());

// request pre-processing middleware
// app.use(loopback.compress());

// Create a LoopBack context for all requests
// http://docs.strongloop.com/display/public/LB/Using+current+context
// app.use(loopback.context());



app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');



// just for test
var reqCallCount = 0;
app.all('*', function(req, res, next){
	console.log("===================="+ ++reqCallCount +": "+ req.hostname + req.path);
	console.log(req.method);
	console.log("[server.js] req.headers ---" );
	console.log(req.headers);

	console.log("[server.js] req.signedCookies ---");
	console.log(req.signedCookies);

	console.log("[server.js] req.accessToken ---");
	console.log(req.accessToken);

	console.log("[server.js] req.body ---");
	console.log(req.body);

	next();
}, function(req, res, next){
	console.log("[server.js] wow");
	next();
},function (req, res, next) {
	console.log("[server.js] wow2");
	next();
});

app.start = function() {
	console.log("app.start ");
	// start the web server
  return app.listen(function() {
    var baseUrl = 'http://' + app.get('host') + ':' + app.get('port');
    app.emit('started', baseUrl);
    console.log('LoopBack server listening @ %s%s', baseUrl, '/');
		if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
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

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err){
	if (err) throw err;

	// start the server if `$ node server.js`
	if(require.main === module) {
	  app.start();
	}
});

/*
* body-parser is a piece of express middleware that
*   reads a form's input and stores it as a javascript
*   object accessible through [req.body]
*/
var bodyParser = require('body-parser');
// to support JSON-encoded bodies
app.middleware('parse', bodyParser.json());
// to support URL-encoded bodies
app.middleware('parse', bodyParser.urlencoded({
  extended: true
}));
/**
 * Flash messages for passport
 *
 * Setting the failureFlash option to true instructs Passport to flash an
 * error message using the message given by the strategy's verify callback,
 * if any. This is often the best approach, because the verify callback
 * can make the most accurate determination of why authentication failed.
 */
var flash = require('express-flash');


// The access token is only available after boot
// but in 'http://docs.strongloop.com/display/public/LB/Making+authenticated+requests'
// To use cookies for authentication, add the following to server.js (before boot):
// http://apidocs.strongloop.com/loopback/#loopback-token
// [req.accessToken] will attached by rest-api.js NOT THIS.
// [req.signedCookies.access_token] will atached
app.middleware('auth', loopback.token({
	// this is defaults
	// cookies: ['authorization'],
	// headers: ['authorization', 'X-Access-Token'],
	// params: ['access_token'],
	model: app.models.AccessToken
}));

// Enable http session
// Parse Cookie header and populate [req.cookies] with an object keyed by the cookie names. Optionally you may enable signed cookie support by passing a secret string, which assigns [req.secret] so it may be used by other middleware.
app.middleware('session:before', loopback.cookieParser(app.get('cookieSecret')));

// be sure to use express.session() before passport.session()
// to ensure that the login session is restored in the correct order.
// http://passportjs.org/guide/configure/
// [req.session] attach!
app.middleware('session', loopback.session({
	secret: 'kittycat',
	saveUninitialized: true,
	resave: true
}));

// passportjs attach [req.user] contains the authenticated user
// Serialization and deserialization is only required if passport session is
// enabled
passportConfigurator.init();
app.use(flash());	// We need flash messages to see passport errors
passportConfigurator.setupModels({
	userModel: app.models.Customer,
	userIdentityModel: app.models.UserIdentity,
	userCredentialModel: app.models.UserCredential
});
// attempt to build the providers/passport config
var passportConfig = {};
try {
  passportConfig = require('../credentials/providers.json');
} catch (err) {
	console.log("[server.js] there is no credential file: ex)credentials/providers.json");
  console.trace(err);
  process.exit(1); // fatal
}
for (var s in passportConfig) {
	var c = passportConfig[s];
	c.session = c.session !== false;
	passportConfigurator.configureProvider(s, c);
}


/*
 * 5. Add a basic application status route at the root `/`.
 *
 * (remove this to handle `/` on your own)
 */
app.all('*', function(req, res, next){
	console.log("-----after boot------");
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


// persist Application for Notification
function updateOrCreateApplication(cb) {
	var yotooApp = require("../yotoo-app");
	var Application = app.models.Application;
  Application.findOne({
      where: {
        name: yotooApp.name
      }
    },
    function(err, result) {
      if (err) cb(err);
      if (result) {
        console.log('[server.js] Updating application: ' + result.id);
        result.updateAttributes(yotooApp, cb);
      } else {
        console.log('[server.js] Registering a new Application...');
        Application.register(
          yotooApp.userId, // 'put your developer id here',
          yotooApp.name, //'put your unique application name here',
          {
            description: yotooApp.description,
            pushSettings: yotooApp.pushSettings
          },
          function(err, app) {
            if (err) {
              console.error("[server.js]  register app error");
              return cb(err);
            }
            console.log("[server.js]  register app success");
            return cb(null, app);
          }
        );
      }
    });
}
updateOrCreateApplication(function (err, appModel) {
  if (err) throw err;
  console.log('[server.js] Application id: %j', appModel.id);
});


// Unveil the VeiledCompleteYo
var UNVEIL_COOL_DOWN = (app.get('env') == "development") ? 2000 : 1000 * 60 * 60;	// 2 sec or 1 hour
setTimeout(unveilCompleteYo, UNVEIL_COOL_DOWN);
function unveilCompleteYo(){
	// unveil complete yos one by one
	app.models.VeiledCompleteYo.findOne({
		where: {
			error: "NONE"
		}
	}, function(err, veiledCompleteYo){
		if(!veiledCompleteYo){
			// cool down when all complete yos are unveiled
			// console.log("[server.js] nothing to unveil. cool down for " + UNVEIL_COOL_DOWN/1000 + "sec");
			setTimeout(unveilCompleteYo, UNVEIL_COOL_DOWN*Math.random());
			return;
		}
		notification = new app.models.Notification({
			alert: " ☞ 💥 ☜",  // needs i18n ⧒🌟💥💦✨
			badge: 1
		});

		// MAKE SURE IF ORIGINAL YO IS STILL EXIST BEFORE THE YO COMPLETE.
		app.models.Yo.find({
			"limit": 2,	// for better speed
			"where": {
				"or": [
					{"and": [{userId: veiledCompleteYo.aUserId}, {receiverId: veiledCompleteYo.bId}]},
					{"and": [{userId: veiledCompleteYo.bUserId}, {receiverId: veiledCompleteYo.aId}]}
				]
			}
		}, function(err, yos){
			console.log("[server.js] found original yos for notification: "+ JSON.stringify(yos) );
			if(yos.length === 2){
				// push notification each other
				app.models.Push.notifyByQuery({
		      appId: "com.dasolute.yotoo",
		      userId: veiledCompleteYo.userId
		    }, notification,
		    function(err) {
		      console.log("[server.js] yotoo notification will send to userId:"+ veiledCompleteYo.aUserId + ", "+ veiledCompleteYo.bUserId);
					if(err){
						veiledCompleteYo.error = err.name;
						veiledCompleteYo.message = err.message;
						veiledCompleteYo.save(function(){
							setTimeout(unveilCompleteYo, 0);	// recursive call
						});
					}else{
						veiledCompleteYo.destroy(function(){
							setTimeout(unveilCompleteYo, 0);	// recursive call
						});
					}
		    });

				// update the original yos's complete field to true
				app.models.Yo.updateAll({
					"or":[
						{"and": [{"userId": veiledCompleteYo.aUserId}, {"receiverId": veiledCompleteYo.bId}]},
						{"and": [{"userId": veiledCompleteYo.bUserId}, {"receiverId": veiledCompleteYo.aId}]}
					]
				},{complete: true}, function(err, info){
					// console.log("[server.js] make "+ info.count +" of yos are completed!");
				});
				// yos[0].complete = yos[1].complete = true;
				// yos[0].save({validate:false});
				// yos[1].save({validate:false});
			}else{
				// remove veiledCompleteYo, that yo is canceled
				veiledCompleteYo.destroy(function(){
					setTimeout(unveilCompleteYo, 0);	// recursive call
				});
			}
		});	// end of app.models.Yo.find()

	});
}

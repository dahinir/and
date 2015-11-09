
var fs = require("fs"),
  path = require("path"),
  _ = require("underscore");

_.extend(exports, {
  id: "com.dasolute.yotoo",
  userId: "dahini@dasolute.com",
  name: "yotoo",

  description: "mobile app",
  pushSettings: {
    apns: {
      certData: readCredentialsFile("apns_cert_dev.pem"),
      keyData: readCredentialsFile("apns_key_dev.pem"),
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
      // serverApiKey: gcmServerApiKey
    }
  }
});

//--- Helper functions ---
function readCredentialsFile(name) {
  return fs.readFileSync(
    path.resolve(__dirname, 'credentials', name),
    // path.resolve(__dirname, 'cre', name),
    'UTF-8'
  );
}

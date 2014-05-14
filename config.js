
var fs = require('fs');
var path = require('path');

// Replace with your unique name
exports.appName = 'yotoo';

// Use your own Server Key as generated by Google Developer Console
// For more details, see http://developer.android.com/google/gcm/gs.html
// exports.gcmServerApiKey = 'Your-server-api-key';

// You may want to use your own credentials here
exports.apnsCertData = readCredentialsFile('apns_cert_dev.pem');
exports.apnsKeyData = readCredentialsFile('apns_key_dev.pem');
// exports.apnsCertData = readCredentialsFile('cert.pem');
// exports.apnsKeyData = readCredentialsFile('key.pem');

// console.log(exports.apnsCertData);

//--- Helper functions ---
function readCredentialsFile(name) {
  return fs.readFileSync(
    path.resolve(__dirname, 'credentials', name),
    // path.resolve(__dirname, 'cre', name),
    'UTF-8'
  );
}

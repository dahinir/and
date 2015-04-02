module.exports = function enableAuthentication(server) {
  console.log('authentication.js')
  // enable authentication
  server.enableAuth();
};

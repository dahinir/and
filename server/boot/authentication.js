module.exports = function enableAuthentication(server) {
  console.log("[authentication.js] called");
  // enable authentication
  server.enableAuth();
};

// https://docs.strongloop.com/display/public/LB/Defining+middleware

module.exports = function(options) {
  return function customHandler(req, res, next) {
    console.log("[testHandler.js] customHandler called");
    // use options to control handler's behavior
    next();
  }
};

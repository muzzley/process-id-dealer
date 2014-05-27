var request = require('request');

var errors = {
  INVALID_PARAMS: 1000,
  UNSUCCESSFUL_REQUEST: 1001
};

/**
 * Get an Id for a given pid and context.
 * 
 * @param  {object}   options  Parametrization options. Possible properties:
 *                             - pid: The process's pid.
 *                             - namespace: The contextual namespace of the process.
 *                             - url: The full URL of the proces id dealer server.
 *                             - timeout: Optional timeout in ms. Default: 5000.
 *
 * @param  {Function} callback function (err, id)
 * @return {undefined}
 */
function getId(options, callback) {
  options = options || {};
  if (!options.pid || !options.namespace || !options.url) {
    var err = new Error('Invalid parameters provided');
    err.code = errors.INVALID_PARAMS;
    return callback(new Error('Invalid parameters provided'));
  }

  var queryString = '?namespace='+options.namespace+'&pid='+options.pid;
  var requestOptions = {
    json: true,
    url: options.url + queryString,
    timeout: options.timeout || 5000
  };

  request.get(requestOptions, function (error, response, body) {
    if (error || !body) {
      var err = new Error('Unsuccessful request: ' + error);
      err.code = errors.UNSUCCESSFUL_REQUEST;
      return callback(err);
    }
    return callback(null, body.id);
  });
}

exports = module.exports = {
  getId: getId,
  errors: errors
};
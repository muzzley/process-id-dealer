var request = require('request');

var errors = {
  INVALID_PARAMS: 1000,
  UNSUCCESSFUL_REQUEST: 1001
};

function getId(options, callback) {
  options = options || {};
  if (!options.pid || !options.namespace || !options.url) {
    var err = new Error('Invalid parameters provided');
    err.code = errors.INVALID_PARAMS;
    return callback(new Error('Invalid parameters provided'));
  }

  var queryString = '?namespace='+options.namespace+'&pid='+options.pid;

  request.get({ json: true, url: options.url + queryString }, function (error, response, body) {
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
var Hapi = require('hapi');
var Joi = require('joi');
var Dealer = require('./Dealer');
var Logger = require('./Logger');

/**
 * Creates an instance of the Dealer's HTTP Server.
 * 
 * @param {object} options The following parameters are supported:
 *                         - server:
 *                           - port
 *                           - baseUri
 *                           - token
 */
var DealerServer = function (options) {
  var self = this;
  options = options || {};

  this.dealer = new Dealer();

  // Create an HTTP server with a host and port
  this.server = Hapi.createServer(
    options.host,
    options.port,
    {
      state: {
        cookies: {
          parse: false,
          // since parse is `false`, the settings below are just for peace of mind
          failAction: 'log',
          strictHeader: false
        }
      }
    }
  );

  this.server.on('log', function (event, tags) {
    if (tags.error) {
      Logger.log('error', 'Server error.', { data: (event.data ? event.data : 'unspecified') });
    }
  });

  this.server.on('request', function (request, event, tags) {
    if (tags.error && tags.state) {
      Logger.log('error', 'Request error', { event: event });
    }
  });

  this.server.on('internalError', function (request, err) {
    Logger.log('crit', 'Error response (500) sent for request: ' + request.id + ' because: ' + err.message);
  });

  // Ex: /process-id/deal
  var dealPath = options.baseUri + 'deal';

  // -------------------------------
  // GET /process-id/deal handler
  // -------------------------------
  /**
   * @api {get} /process-id/deal Get an indentifier for this process id
   * @apiVersion 0.1.0
   * @apiName GetProcessIdentifer
   * @apiGroup Process Id
   *
   * @apiDescription
   * 
   * Get an indentifier for this process id.
   * 
   * @apiParam {String} namespace The process type namespace.
   * @apiParam {String} pid       The process pid.
   *
   * @apiExample CURL example:
   *     curl -i -X GET "http://localhost:4002/process-id/deal?namespace=com.example&pid=1234"
   *
   * @apiSuccess {Number} statusCode  The HTTP Status Code. 200 if successful, 401, 500, ...
   * @apiSuccess {String} id The id that was assigned to this process.
   * 
   * @apiSuccessExample Success-Response example:
   *     HTTP/1.1 200 OK
   *     {
   *       "statusCode": 200,
   *       "id"; "0"
   *     }
   * 
   * @apiError BadRequest   One or more parameters were not valid. Check the <code>message</code> field for details.
   * 
   * @apiErrorExample Error-Response (example):
   *     HTTP/1.1 401 Not Authenticated
   *     {
   *       "statusCode": 401,
   *       "error": "BadRequest",
   *       "message": "Invalid request"
   *     }
   */
  this.server.route({
    method: 'GET',
    path: dealPath,
    config: {
      handler: function (request, reply) {
        var namespace = request.query.namespace;
        var pid = request.query.pid;
        Logger.log('info', '[Request: '+request.id+'] GETting id', request.query);

        self.dealer.deal(
          {
            pid: pid,
            type: namespace
          },
          function (err, id) {
            if (err) {
              Logger.log('crit', '[Request: '+request.id+'] Error dealing id: ' + err);
              reply(new Error('Could generate an id'));
              return;
            }
            Logger.log('info', '[Request: '+request.id+'] Dealt id ' + id);
            reply({
              statusCode: 200,
              id: id
            });
          }
        );
      },
      validate: {
        query: {
          namespace: Joi.string().required(),
          pid: Joi.string().required()
        }
      }
    }
  });
  Logger.log('info', 'Dealing Process Id at GET ' + dealPath);
};

/**
 * Start listening for connections
 * @param  {Function} callback
 * @return {undefined}
 */
DealerServer.prototype.start = function(callback) {
  this.server.start(callback);
};

exports = module.exports = DealerServer;

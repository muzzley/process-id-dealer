var Dealer = require('./lib/Dealer');
var DealerServer = require('./lib/DealerServer');
var Logger = require('./lib/Logger');
var config = require('./config');

Logger.log('crit', '#### Starting Process Id Dealer ####');

var server = new DealerServer(config.server);

server.start(function () {
  Logger.log('info', 'Server up and listening at port ' + config.server.port);
});

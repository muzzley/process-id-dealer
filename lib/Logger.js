var util = require('util');
var EventEmitter = require('events').EventEmitter;
var winston = require('winston');
var config = require('../config');

var emitter = new EventEmitter();

var logLevel = config.logger.level;
var logFile = config.logger.filename;
var consoleLogger = config.logger.console;
var jsonLogger = (typeof config.logger.json !== 'undefined') ? config.logger.json : true;

var transports = [];

if (jsonLogger) {
  transports.push(
    new (winston.transports.File)({
      level: logLevel,
      filename: logFile
    })
  );
}

// If the console logger has been enabled in the
// config file, create it as well
if (consoleLogger) {
  transports.push(
    new (winston.transports.Console)({
      level: logLevel,
      colorize: true,
      timestamp: true
    })
  );
}

var winstonLogger = new (winston.Logger)({
  transports: transports
});

// Set our own logging level in the inverse order of the
// syslog one. That's because Winston weirdly prints all
// messages equal or lower (less critical) to the default level
// instead of equal or higher (more critical).
winstonLogger.setLevels({
  emerg: 7,
  alert: 6,
  crit: 5,
  error: 4,
  warning: 3,
  notice: 2,
  info: 1,
  debug: 0
});

var Logger = function () {

  this.logCaller = null;

  EventEmitter.call(this);
};
util.inherits(Logger, EventEmitter);

Logger.getLogger = function (caller) {
  var l = new Logger();
  l.logCaller = caller;
  return l;
};

Logger.prototype.log = function (level, message, options) {
  options = options || {};
  // options.caller = this.logCaller;
  this.emit('log', level, '['+process.pid+'] ' + message, options);
};

Logger.prototype.error = function (err, options) {
  if (!err) return;
  winstonLogger.log('error', err, options);
};

var loggerInstance = new Logger();

// TODO refactor this to be independent and to link it to the Winston logger
loggerInstance.on('log', function (level, message, options) {
  winstonLogger.log(level, message, options);
});

exports = module.exports = loggerInstance;
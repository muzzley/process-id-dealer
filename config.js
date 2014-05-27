function parseBoolean(value, def) {
  if (typeof value === 'undefined' || typeof value !== 'string') {
    return def;
  }
  if (value.toLowerCase() === 'true') {
    return true;
  }
  return false;
}

var config = {};

config.production = {
  server: {
    host: process.env.PROCESS_ID_DEALER_SERVER_HOST || '0.0.0.0',
    port: process.env.PROCESS_ID_DEALER_SERVER_PORT || 4002,
    baseUri: process.env.PROCESS_ID_DEALER_SERVER_BASE_URI || '/process-id/',
  },
  logger: {
    console: parseBoolean(process.env.PROCESS_ID_DEALER_LOG_CONSOLE, false),
    level: process.env.PROCESS_ID_DEALER_LOG_LEVEL || 'info',
    filename: process.env.PROCESS_ID_DEALER_LOG_AGGREGATE || '/var/log/process-id-dealer/process-id-dealer.json.log'
  }
};

config.development = JSON.parse(JSON.stringify(config.production));

config.development.logger = {
  console: parseBoolean(process.env.PROCESS_ID_DEALER_LOG_CONSOLE, true),
  level: process.env.PROCESS_ID_DEALER_LOG_LEVEL || 'debug',
  filename: process.env.PROCESS_ID_DEALER_LOG_AGGREGATE || 'process-id-dealer.json.log'
};

exports = module.exports = config[process.env.NODE_ENV] || config['production'];
var levelup = require('levelup');
var ps = require('ps-node');
var running = require('is-running');
var mutex = require('./mutex');

// Storage format:
// processes:<type> = {
//   count: 2,
//   p0: { pid: 123, command: 'node', args: 'index.js'},
//   p2: { ... }
// }
var Dealer = function (options) {

  options = options || {};
  options.database = options.database || 'dealer-db';

  this.db = levelup(options.database, { valueEncoding: 'json' });
};

/**
 * Deal the lowest available identifier.
 * 
 * @param  {object}   options  Requires the following params:
 *                             - pid
 *                             - type. Represents the namespace.
 * @param  {Function} callback
 * @return {[type]}            [description]
 */
Dealer.prototype.deal = function (options, callback) {
  if (typeof callback !== 'function') {
    throw new Error('The callback parameter is mandatory.');
  }

  var self = this;

  options = options || {};
  var pid = parseInt(options.pid, 10);
  var type = options.type;

  getPidInfo(pid, function (err, pidInfo) {
    if (err) {
      return callback(new Error('Could not get PID info. Error: ' + err));
    }

    self.addMonitoredPid(type, pidInfo, function (err, index) {
      callback(err, index);
    });

  });
};

Dealer.prototype.deleteProcessIndex = function(index, obj) {
  delete obj['p'+index];
  obj.count--;
};

Dealer.prototype.addNewPid = function (index, obj, pidInfo) {
  obj['p'+index] = pidInfo;
  obj.count++;
};

Dealer.prototype.getMonitoredPids = function(type, callback) {
  var key = 'processes:'+type;
  this.db.get(key, function (err, result) {
    if (err) {
      return callback(new Error('Could retrieve monitored processes info for type ' + type + '. Error: ' + err));
    }
    return callback(null, JSON.parse(result));
  });
};

Dealer.prototype.saveMonitoredPids = function (type, obj, callback) {
  var key = 'processes:'+type;
  this.db.put(key, JSON.stringify(obj), function (err, result) {
    if (err) {
      return callback(new Error('Could save monitored processes info for type ' + type));
    }
    return callback(null);
  });
};

/**
 * Cleans up the currently monitored PIDs and inserts
 * the new pid info into the first available slot.
 * 
 * @param {string}   type     [description]
 * @param {object}   pidInfo  [description]
 * @param {Function} callback function (err, insertedIndex)
 */
Dealer.prototype.addMonitoredPid = function (type, pidInfo, callback) {
  var firstFreeIndex = Infinity;
  var self = this;

  function finishSync(err, savedIndex) {
    mutex.complete(type);
    callback(err, savedIndex);
  }

  function startSynchronized() {

    self.getMonitoredPids(type, function (err, result) {
      if (!result) {
        result = { count: 0 };
      }

      var key;
      var pid;
      var pidObj;
      var count = result.count;
      function cleanupLoop(i) {
        key = 'p'+i;
        pidObj = result[key];

        if (!pidObj) {
          firstFreeIndex = Math.min(firstFreeIndex, i);
          return cleanupLoop(++i);
        }

        pid = pidObj.pid;

        running(pid, function(err, isRunning) {
          if (err) {
            finishSync(new Error('Could not check running status of pid ' + pid));
            return;
          }

          if (!isRunning || pid === pidInfo.pid) {
            // Either the monitored PID is not running any more
            // or the user is trying to monitor the same PID twice
            // Mark this index as free and add the new/same PID
            firstFreeIndex = Math.min(firstFreeIndex, i);
            self.deleteProcessIndex(i, result);
          }

          if (--count <= 0) {
            // No more monitored PIDs

            firstFreeIndex = Math.min(firstFreeIndex, i+1);
            self.addNewPid(firstFreeIndex, result, pidInfo);
            self.saveMonitoredPids(type, result, function () {
              finishSync(null, firstFreeIndex);
            });
            return;
          }

          return cleanupLoop(++i);
        });
      }

      if (result.count) {
        cleanupLoop(0);
      } else {
        self.addNewPid(0, result, pidInfo);
        self.saveMonitoredPids(type, result, function () {
          finishSync(null, 0);
        });
      }
    });

  } // mutex
  mutex.add(type, startSynchronized);
};

function getPidInfo(pid, callback) {
  ps.lookup({ pid: String(pid),  psargs: 'aux' }, function (err, resultList) {
    if (err) {
      return callback(err);
    }
    var process = resultList[0];
    if(process){
      var args  = process.arguments ? process.arguments.join(' ') : '';
      return callback(null, { pid: pid, command: process.command, args: args });
    }
    else {
      return callback(new Error('Process not found'));
    }
  });
}

exports = module.exports = Dealer;

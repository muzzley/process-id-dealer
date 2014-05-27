var queue = {};
var defaultContext = '__default__';

exports = module.exports = {

  // function([context,] entryFunction)
  add: function (context, entryFunction) {
    if (arguments.length == 1) {
      entryFunction = context;
      context = defaultContext;
    }
    if (!queue[context]) {
      queue[context] = [];
    }
    queue[context].push(entryFunction);
    if (queue[context].length == 1) {
      entryFunction();
    }
  },
  // function([context])
  complete: function (context) {
    context = context || defaultContext;
    // Remove the just completed function from the queue
    queue[context].shift();
    if (queue[context].length === 0) {
      delete queue[context];
    } else {
      // Get the next waiting function in line
      var entryFunction = queue[context][0];
      entryFunction();
    }
  }

};
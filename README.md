# Process Id Dealer

This project deals unique, sequential, reusable and contextual identifiers for processes running on a machine.

If you're running multiple instances of the same application and need to associate a small and reusable identifier, you've come to the right place.

Why not simply use `pid`s? Because `pid`s are too volatile for our use case.

Let's consider an example:

* The first, second and third instances get ids 0, 1 and 2, respectively.
* Now, if the second instance dies and another instance comes up, that new instance will be given id 1 since it was "freed" by the dying instance.
* If a different process type is run, it will be given id 0 as the process dealer is contextual.

This project was motivated by this StackOverflow question: http://stackoverflow.com/questions/23651327/sequential-and-contextual-process-identifier

The project is written in Node.js but can be used by any other language as it provides an HTTP server through wich the ids are dealt.

## Running the server

Clone or download this project. Then run it as:

    node server.js

The server can be configured. Have a look at the `config.js` file. You can change the `config.js` file directly but that is not recommended. All configuration options have associated environment variables which you can either define system-wide or just for the running session. So, to change the port at which the HTTP server listens, you could run:

    PROCESS_ID_DEALER_SERVER_PORT=5000 node server.js

**As the ids are dealt based on the original `pid`s of the requesting applications and recycled when old `pid`s die, it's necessary to run an instance of this server on each machine**.

If the server dies or is restarted, the dealt ids are maintained since we're using LevelDB for storage.

## Requesting an id

Using the default configuration, ids are dealt with the following request properties:

* Request type: `GET`
* Port: `4002`
* Query parameters:
    * `namespace`: A string identifier of the requesting app. This allows multiple types of apps to have independently dealt ids.
    * `id`: The requesting process's `pid`.

### Generic way

You can request an id by visiting the server's URL, for example:

    http://localhost:4002/process-id/deal?namespace=com.example.app&pid=1234

And here's the corresponding cURL command:

    curl -i -X GET "http://localhost:4002/process-id/deal?namespace=com.example.app&pid=1234"

The response is a JSON string as shown below. In this case, we were dealt id `0`.

    {"statusCode":200,"id":0}

### From a Node.js app

This project also provides a client library for Node.js apps. You're welcome. The following code illustrates how you can request an id directly from your Node.js app.

First, install the npm module:

    npm install process-id-dealer

Then, use it like this:

    var dealerClient = require('process-id-dealer').client;

    var options = {
      pid: process.pid,
      namespace: 'com.example.app',
      url: 'http://localhost:4002/process-id/deal',
      timeout: 10000  // Optional request timeout in ms. Default: 5000.
    };

    dealerClient.getId(options, function (err, id) {
      if (err) {
        // An error such as timeout or connection refused. Bad luck, junior.
        return;
      }
      // Successful request. `id` is the dealt identifer.
    });

require('dotenv').config()
const WebSocketServer = require('websocket').server;
const http = require('http');


var server = http.createServer(function (request, response) {
    // process HTTP request. Since we're writing just WebSockets
    // server we don't have to implement anything.
});
server.listen(parseInt(process.env.PORT) || 8080, function () { 
    console.log('Listening on port ' + parseInt(process.env.PORT) || 8080 )
});

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

var connections = {
    canvas: {},
    controller: {}
};

// WebSocket server
wsServer.on('request', function (request) {
    var valid = true;
    if (request.resourceURL.query.type == 'controller')
        if (request.resourceURL.query.key != process.env.CLIENT_PASSWORD)
            valid = false

    if (valid) {
        var connection = request.accept(null, request.origin);
        connection.key = request.key;
        connection.viewType = request.resourceURL.query.type;

        console.log(connection.viewType+' ('+connection.key+') is connecting!');

        connection.sendUTF(
            JSON.stringify({ 
                metadata: { type: 'info' }, 
                data: 'You are connected to server :-)' 
            })
        );

        // This is the most important callback for us, we'll handle
        // all messages from users here.
        connection.on('message', function (message) {
            try {
                var json = JSON.parse(message.utf8Data);
                react(json,this.key);
            } catch (e) {
                console.error('Error',e);
                return;
            }
        });

        connection.on('close', function (connection) {
            // close user connection
            //reset();
            console.log('closing connection with '+this.key);
            delete connections[this.viewType][this.key];
        });

        connections[connection.viewType][connection.key] = connection;
    } else {
        console.log('not valid controller!')
        request.reject();
    }
});

function react(message,id) {
    switch (message.metadata.type) {
        case 'broadcastViews':
            console.log('broadcasting views');
            Object.keys(connections.canvas).forEach((connectionKey) => {
                connections.canvas[connectionKey].sendUTF(
                    JSON.stringify({ metadata: message.data.metadata, data: message.data.data })
                );
            });
            break;
        default:
            console.log('logging');
            console.log(message.data);
            break;
    }
}
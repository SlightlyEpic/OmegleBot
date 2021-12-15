let Client = require('./client.js');
let config = require('./config.json');
let log = require('./util/colourLog.js');

let clients = [];
for(i = 0; i < config.botCount; i++) {
    clients.push(new Client(i, {
        messages: config.messages,
        autoReconnect: true,
        logSentMessages: true,
        verbose: true
    }));
}

async function launchAllClientsOneByOne(clientsArr, currIndex = 0) {
    if(currIndex == clientsArr.length) return 0;
    clientsArr[currIndex].launch();
    return launchAllClientsOneByOne(clientsArr, currIndex + 1);
}

launchAllClientsOneByOne(clients);

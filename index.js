var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var app = express();

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Index
app.get('/', function (req, res) {
    res.send('Hello')
});

// Facebook authentication
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
});


/******* COMMANDS *******/
var COMMANDS = ["command", "man", "status"];
var DESCRIPTIONS = {"command" : "Gives a listing of all commands", "man" : "man [command] shows how to use a command", "status" : "status [email] [bus | app] gives your current status"};
var COMMANDS_ARGS = {"command" : [], "man" : COMMANDS, "status" : [["email"], ["bus", "app"]]};
var COMMAND_ARG_LENGTH = {"command" : 0, "man" : 1, "status" : 2};

/************************/

var token = "EAAOB3vqlxuYBAJTO8BPFuWaWQxRPyFvFUS7ZCdUigBeSugbax6z0U2cJ7fPMmwixnvnPv84iyPOoCzZB25oSZAf6zIuwpMa7gCwZBggbAKhW11IZAj483vapXrPvLKZAKI5HiB02VTZBCCjQtaZBRRuiAoL1D0Hg0JMjMM97SR5aZAQZDZD";

// Parse input message
function parseMessage(text) {
    var split = text.split(" ");
    var index = COMMANDS.index(split[0].toLowerCase()); // Parent method already checks for existance of some text
    if (index > -1) {
        var commandName = COMMANDS[index];
        if (COMMAND_ARG_LENGTH[commandName] != split.length()) {
            return "invalid args";
        }
        if (commandName == "man" && COMMANDS.index(split[1]) > -1) {
            return man(split[1]);
        }
        return "invalid args";
    }
    return "not a command";

};

function man(arg) {
    return DESCRIPTIONS[arg];
};

// Send simple text outbound message
function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
};

// Respond the incoming messages
app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text;
            console.log(text);
            var xhr = new XMLHttpRequest();
            var data = "";
            xhr.open('GET', 'https://graph.facebook.com/v2.6/' + sender + '?fields=first_name&access_token=' + token, false);

            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 400) {
                    data = JSON.parse(xhr.responseText);
                }
            };

            xhr.send();
            sendTextMessage(sender, "Hey " + data.first_name + "!");
            sendTextMessage(sender, "Type 'command' for more info!");
        }
    }
    res.sendStatus(200)
});

// Server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
});


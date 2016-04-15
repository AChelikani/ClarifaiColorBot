var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

function getNameFromID(id) {
    var request = new XMLHttpRequest();
    var data = "";
    request.open('GET', 'https://graph.facebook.com/v2.6/' + id + '?fields=first_name&access_token=EAAOB3vqlxuYBAJTO8BPFuWaWQxRPyFvFUS7ZCdUigBeSugbax6z0U2cJ7fPMmwixnvnPv84iyPOoCzZB25oSZAf6zIuwpMa7gCwZBggbAKhW11IZAj483vapXrPvLKZAKI5HiB02VTZBCCjQtaZBRRuiAoL1D0Hg0JMjMM97SR5aZAQZDZD', false);

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            data = JSON.parse(request.responseText);
        }
    };

    request.send();

    return data.first_name;
};

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
}

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    console.log(req)
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text
            var test = getNameFromID(sender);
            sendTextMessage(sender, "Hello " + sender)
        }
    }
    res.sendStatus(200)
})

var token = "EAAOB3vqlxuYBAJTO8BPFuWaWQxRPyFvFUS7ZCdUigBeSugbax6z0U2cJ7fPMmwixnvnPv84iyPOoCzZB25oSZAf6zIuwpMa7gCwZBggbAKhW11IZAj483vapXrPvLKZAKI5HiB02VTZBCCjQtaZBRRuiAoL1D0Hg0JMjMM97SR5aZAQZDZD"

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})


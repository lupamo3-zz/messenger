'use strict';

// const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const PAGE_ACCESS_TOKEN = "EAADZBJYs5EhMBADBZCLBk2qGBff7BgpIiv8xpVZCc1rBmUCt6EGBrC0nZAOLuhVe2qnrzJ3lpIPpAjwZBRagGN4GdcVj1EUcCD5ZAvf3dvogymG7yq5mJSXGuZANrz1EyVkl9U2DeVqg1Id8kiWes97eqlvIPvFYpZB6ZBnmjomZAdZCdgqYwW4IuLY"

const express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json());

const request = require('request');

app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));


app.post('/webhook', (req, res) => {

    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(function (entry) {

            //Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log("show webhook event: " + webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            //Check if the event is a message or postback and pass
            //the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        res.status(200).send('EVENT_RECEIVED');

    } else {
        res.sendStatus(404);
    }
});


app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = "verify_token";

    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }

});

// Handles messages events
function handleMessage(sender_psid, received_message) {

    let response;

    //check if the message contains text
    if (received_message.text) {    

        // Create the payload for a basic text message, which
       // will be added to the body of our request to the Send API
        response = {
          "text": `You sent the message: "${received_message.text}". Now Use the attachment feature!`
        };

    } else if (received_message.attachments) {

        // Gets the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        };
    }

    // Send the response message
    callSendAPI(sender_psid, response);

}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;

    // GEt the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = {"text": "Thanks, please input your name!" }

    } else if (payload === 'no') {
        response = { "text": "Oops, try sending another image." };
    }

    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
      "recipient": {
        "id": sender_psid
      },
      "message": response
    };

    //Send the HTTP request to the Messenger platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
      }, (err, res, body) => {
        if (!err) {
          console.log('message sent!')
        } else {
          console.error("Unable to send message:" + err);
        }
      }); 
    }







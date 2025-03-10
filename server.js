'use strict';

// express is a nodejs web server
// https://www.npmjs.com/package/express
const express = require('express');

// converts content in the request into parameter req.body
// https://www.npmjs.com/package/body-parser
const bodyParser = require('body-parser');

// bring in firestore
const Firestore = require("@google-cloud/firestore");

// initialize Firestore and set project id from env var
const firestore = new Firestore(
    {
        projectId: process.env.GOOGLE_CLOUD_PROJECT
    }
);

// create the server
const app = express();

// the backend server will parse json, not a form request
app.use(bodyParser.json());

// health endpoint - returns an empty array
app.get('/', (req, res) => {
    res.json([]);
});

// version endpoint to provide easy convient method to demonstrating tests pass/fail
app.get('/version', (req, res) => {
    res.json({ version: '1.0.0' });
});

function getEvents(req, res) {
    const returnObj = { events: []};
        firestore.collection("Events").get()
            .then((snapshot) => {
                    if (!snapshot.empty) {
                        snapshot.docs.forEach(doc => {
                        const eventObj = doc.data();
                        //get internal firestore id and assign to object
                        eventObj.id = doc.id;
                        //add object to array
                        console.log(eventObj);
                        returnObj.events.push(eventObj);
                        }); 
                }
            res.json(returnObj);
        })
        .catch((err) => {
            console.error('Error getting events', err);
            res.json(returnObj);
        });
};

// get events endpoint. this would be replaced by a call to a datastore
// if you went on to develop this as a real application.
app.get('/events', (req, res) => {
    getEvents(req, res);
});

// Adds an event - in a real solution, this would insert into a cloud datastore.
// Currently this simply adds an event to the mock array in memory
// this will produce unexpected behavior in a stateless kubernetes cluster. 
app.post('/event', (req, res) => {
    // create a new object from the json data and add an id
    const ev = { 
        title: req.body.title, 
        description: req.body.description
     }
    // this will create the Events collection if it does not exist
    firestore.collection("Events").add(ev).then(ret => {
        getEvents(req, res);
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

const PORT = 8082;
const server = app.listen(PORT, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log(`Events app listening at http://${host}:${port}`);
});

module.exports = app;
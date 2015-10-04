var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var twilio = require('twilio');

var db = {}; 

app.use(bodyParser.urlencoded({
	extended: false
}));

var firstMessage = function(number, req, res) {
	// console.log(req.body);
	var twiml = new twilio.TwimlResponse();
	var welcome = "Welcome to Pill Buddy! What's your name?";
	twiml.message(welcome);
	//name = true;
	db[number] = {};
	res.send(twiml.toString());
	
	//call function that listens
};


app.post('/', function(req, res) {
	var twiml = new twilio.TwimlResponse();

	if (!db[req.body.From]) {
		console.log('inside the block')
		return firstMessage(req.body.From, req, res);
	}
	console.log('i am hitting this')
	if (!db[req.body.From].name) {
		twiml.message("Hi there " + req.body.Body + "! When would you like me to send you reminders?");
		db[req.body.From].name = req.body.Body;
		console.log("TESTINGTESTINGTESTING", db);
		res.send(twiml.toString());
		
		}
	else {
	var splitText = req.body.Body.split(' ');
	var day = splitText[0];
	var time = splitText[1];
	console.log(req.body);
	
	var response = "Remind me on " + day + "s at " + time;
	twiml.message(response);
	res.send(twiml.toString());
	}
	
});


app.listen(3000);
console.log("Listening on port 3000");
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var twilio = require('twilio');

var db = {}; 

app.use(bodyParser.urlencoded({
	extended: false
}));

function Precriptions() {	
	this.prescriptions = {
		Monday: [],
		Tuesday: [],
		Wednesday: [],
		Thursday: [],
		Friday: [],
		Saturday: [],
		Sunday: []
	};
};

Prescriptions.prototype.add = function(day, hour, medication) {
	var lowerDay = day.toLowerCase();
	if (lowerDay === "weekdays") this.addWeekdays(hour, medication);
	else if (lowerDay === "weekends") this.addWeekends(hour, medication);
	else if (lowerDay === "everyday" || lowerDay === "every day") this.addEveryDay(hour, medication);
	else this.addDay(day, hour, medication);
};

Prescriptions.prototype.addDay = function(day, hour, medication) {
	this.prescriptions[day].push({
		time: hour,
		medication: medication
	});
};


Prescriptions.prototype.addWeekdays = function(hour, medication) {
	this.addDay("Monday", hour, medication);
};

Prescriptions.prototype.addEveryDay = function(hour, medication) {
	for (var day in this.prescriptions) {
		this.addDay(day, hour, medication);
	};
};

Prescriptions.prototype.addWeekends = function(hour, medication) {
	this.addDay("Saturday", hour, medication);
};


function Person(firstName) {
	this.firstName = firstName;
};

Person.prototype.getName = function() {
	return this.firstName;
};

var addToDatabase = function(phoneNumber, Person) {
	db[phoneNumber] = Person;
};

var firstMessage = function(From, req, res) {
    var welcomeTwiml = new twilio.TwimlResponse();
	welcomeTwiml.message("Hi! Welcome to Pill Buddy, your favorite pill" +
	"reminder system. What's your name?");
	res.send(welcomeTwiml.toString());

	addPerson(req.body.From, "");
}

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
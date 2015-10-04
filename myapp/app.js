var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var twilio = require('twilio');
var CronJob = require('cron').CronJob;

var db = {}; 

app.use(bodyParser.urlencoded({
	extended: false
}));

function Prescriptions() {	
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

Person.prototype.setName = function(newName) {
	this.firstName = newName;
};

var addToDatabase = function(phoneNumber, Person) {
	db[phoneNumber] = Person;
};

var firstMessage = function(From, req, res) {
    var welcomeTwiml = new twilio.TwimlResponse();
	welcomeTwiml.message("Hi! Welcome to Pill Buddy, your favorite pill" +
	"reminder system. What's your name?");
	res.send(welcomeTwiml.toString());
	var a = new Person("");
	addToDatabase(req.body.From, a);
	//addPerson(req.body.From, "");
}

app.post('/', function(req, res) {
	console.log(req.body);
	var twiml = new twilio.TwimlResponse();
	var num = req.body.From;

	if (!db[num]) {
		return firstMessage(num, req, res);
	}
	else if (!db[num].getName()) {
		db[num].setName(req.body.Body);
		twiml.message("Hi there " + db[num].getName() + "! When would you like me to send you reminders?");
		
		res.send(twiml.toString());
		}

	else {
	var splitText = req.body.Body.split(' ');
	var day = splitText[0];
	var time = splitText[1];
	
	var response = "Great I will remind you on " + day + "s at " + time;
	twiml.message(response);
	res.send(twiml.toString());
	}
	
});


app.listen(3000);
console.log("Listening on port 3000");


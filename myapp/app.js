/*---------------------------------------------------------------------------*/
/* Ben Cohen and Erica Wu 													 */
/* Pill Buddy: A Twillow Text System for Pill reminders        				 */
/* Hack Rutgers - October 3-4, 2015											 */
/* Princeton University '18													 */
/*---------------------------------------------------------------------------*/

// Variables necessary to use Twilio's API.
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var twilio = require('twilio');
var CronJob = require('cron').CronJob;

// A database which stores users' phone number and prescription information.
var db = {}; 

app.use(bodyParser.urlencoded({ extended: false }));


// The Prescriptions class is used in conjunction with the Person class. It
// manages what days and times users have prescriptions.
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

// Add a prescription, either for a single day of the week, weekdays,
// weekends, or every day
Prescriptions.prototype.add = function(day, hour, medication) {
	var lowerDay = day.toLowerCase();
	if (lowerDay === "weekdays") this.addWeekdays(hour, medication);
	else if (lowerDay === "weekends") this.addWeekends(hour, medication);
	else if (lowerDay === "everyday" || lowerDay === "every day") 
		this.addEveryDay(hour, medication);
	else this.addDay(day, hour, medication);
};

// Add a single prescription
Prescriptions.prototype.addDay = function(day, hour, medication) {
	this.prescriptions[day].push({
		time: hour,
		medication: medication
	});
};


// Add a prescription for all weekdays
Prescriptions.prototype.addWeekdays = function(hour, medication) {
	this.addDay("Monday", hour, medication);
};

// Add a prescription for weekends
Prescriptions.prototype.addWeekends = function(hour, medication) {
	this.addDay("Saturday", hour, medication);
};

// Add a prescription for every day
Prescriptions.prototype.addEveryDay = function(hour, medication) {
	for (var day in this.prescriptions) {
		this.addDay(day, hour, medication);
	};
};

// A person is a first name and a prescription
function Person(firstName, prescription) {
	this.firstName = firstName;
	this.prescriptions = prescription;
};

// return the Person's name
Person.prototype.getName = function() {
	return this.firstName;
};


// set the Person's name to newName
Person.prototype.setName = function(newName) {
	this.firstName = newName;
};


// add a phoneNumber: Person pair to the database
var addToDatabase = function(phoneNumber, Person) {
	db[phoneNumber] = Person;
};

// send the user the welcome message and add them to the database
var firstMessage = function(From, req, res) {
    var welcomeTwiml = new twilio.TwimlResponse();
	welcomeTwiml.message("Hi! Welcome to Pill Buddy, your favorite pill" +
	"reminder system. What's your name?");
	res.send(welcomeTwiml.toString());


	var a = new Person("", "");
	addToDatabase(req.body.From, a);
}

// handle message sent from the user to Pill Buddy
app.post('/', function(req, res) {


	// print the message data to console
	console.log(req.body);

	// initialize a twilio object to be sent as a message back to the user
	var twiml = new twilio.TwimlResponse();


	var num = req.body.From;

	// if this is the first message, send the user the welcome message
	if (!db[num]) {
		return firstMessage(num, req, res);
	}
	
	// ask the user for their name, store it, and ask them for reminders
	else if (!db[num].getName()) {
		db[num].setName(req.body.Body);
		twiml.message("Hi there " + db[num].getName() + "! When would you like me to send you reminders?");
		res.send(twiml.toString());
	}

	// handle additions, removals, and changes of prescriptions
	else {	
		var splitText = req.body.Body.split(' ');
		var day = splitText[0];
		var time = splitText[1];
		
		var response = "I'll remind you on " + day + "s at " + time;
		twiml.message(response);
		res.send(twiml.toString());
	}
	
});


app.listen(3000);
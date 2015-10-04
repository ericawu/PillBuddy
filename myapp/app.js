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

// an array of the days of the week
var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
			'Saturday', 'Sunday'];

// account for users pluralizing days of the week
var pluralDaysOfWeek = function(dayNumber, index, input) {
	if (input.charAt(index + days[dayNumber]) === 's') 
		return index + days[dayNumber].length + 1;
};

// move past all white space
var skipWhiteSpace = function(input, index) {
	while (input.charAt(index) !== ' ' && input.charAt(index) !== '\t') &&
		input.charAt(index) !== '\n') index ++;
	return index;
};

// parse the input given by the user and return an array of the command
var parseInput = function(input) {
	var result = [0, 0, 0, 0, 0];
	var index = 0;

	input = input.toLowerCase();

	// determine the action the user wants
	if (input.substring(0, 3) === "add") {
		index = 3;
		result[0] = "add";
	}
	else if (input.substring(0, 6) === "remove") {
		index = 6;
		result[0] = "remove";
	}
	else if (input.substring(0, 6) === "change") {
		index = 6;
		result[0] = "change";
	}
	else {
		var errorTwiml = new twilio.TwimlResponse();
		errorTwiml.message("Try that again. Remember to use \"add,\"" + 
			"\"remove,\" or \"change,\"");
		res.send(errorTwiml.toString());
		return;
	}

	index = skipWhiteSpace(input, index, 1);

	switch (input.substring(index, index + 2)) {

		case ("mo") :
			result[1] = "Monday";
			index = pluralDaysOfWeek(1, index, input);
			break;
		case ("tu") :
			result[1] = "Tuesday";
			index = pluralDaysOfWeek(2, index, input);
			break;
		case ("we") :
			result[1] = "Wednesday";
			index = pluralDaysOfWeek(3, index, input);
			break;
		case ("th") :
			result[1] = "Thursday";
			index = pluralDaysOfWeek(4, index, input);
			break;
		case ("fr") :
			result[1] = "Friday";
			index = pluralDaysOfWeek(5, index, input);
			break;
		case ("sa") :
			result[1] = "Saturday";
			index = pluralDaysOfWeek(6, index, input);
			break;
		case ("su") :
			result[1] = "Sunday";
			index = pluralDaysOfWeek(7, index, input);
			break;
		case ("we") :
			if (input.substring(index, index + 8) === "weekends") {
				result[1] = "Weekends";
			}
			else if (input.substring(index, index + 8) === "weekdays") {
				result[1] = "Weekdays";
			}
			index += 8;
			break;
		case ("ev") :
			result[1] = "Everyday");
			if (input.substring(index, index + 8) === "everyday") index += 8;
			else index += 9;
		default: break;
	}

	var string = input.substring(index, index + 5);

	if (string.charAt(3) === ":") {
		result[2] = string;
		index += 5;
	}
	else if (string.charAt(2) === ":") {
		result[2] = "0" + string;
		index += 4;
	}
	else if ((string.charAt(0) === "1") && (string.charAt(1) === '0' || 
		string.charAt(1) === '1' || string.charAt(1) === '2')) {
		result[2] = string.substring(0, 2) + ":00";
		index += 2;
	}
	else {
		result[2] = "0" + string.charAt(1) + ":00";
		index++;
	}

	if (input.charAt(input.length - 2) === "a") result[4] = "am";
	else result[4] = "pm";

	result[3] = input.substring(index, input.length - 2).trim();

	return result;
};

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
		twiml.message("Hi there " + db[num].getName() + "! With Pill Buddy, " +
			"staying on top of your pill regimen is easy! To modify your " + 
			"pill schedule, write \"add,\" \"remove,\" or \"change,\" " + 
			"followed by a day of the week, a time of the day, the name of " +
			"the medication and \"am\" or \"pm.\" You can also set schedules" +
			" for \"weekdays\", \"weekends,\", or \"every day.\" For " + 
			"example, to add a reminder for Mondays at 9:00 am, write " +
			"\"Monday 9:00 AM.\" When would you like me to remind you?");
		res.send(twiml.toString());
	}

	// handle additions, removals, and changes of prescriptions
<<<<<<< HEAD
	else {
		var command = parseInput(reg.body.Body);

		var action     = command[0];
		var day        = command[1];
		var time       = command[2];
		var medication = command[3];
		var ampm       = command[4];

		var response = "Remind me on " + day + "s at " + time;
=======
	else {	
		var command = parseInput(reg.body.Body);
		var action     = command[0];
		var day        = command[1];
		var time       = command[2];
		var medication = command[3];
		var ampm       = command[4];

		var response = "I'll remind you on " + day + "s at " + time;
>>>>>>> ericawu/master
		twiml.message(response);
		
		var cronJobDates; 
		var cronJobDay;
		switch(day) {
			case Monday: 
				cronJobDay = 01;
				break;
			case Tuesday:
				cronJobDay = 02;
				break;
			case Wednesday:
				cronJobDay = 03;
				break;
			case Thursday: 
				cronJobDay = 04;
				break;
			case Friday:
				cronJobDay = 05;
				break;
			case Saturday:
				cronJobDay = 06;
				break;
			case Sunday:
				cronJobDay = 00;
				break;
			case Weekdays:
				cronJobDay = 1-5;
				break;
		}

		createCronJob('00 19 06 * * *');


		return res.send(twiml.toString());
	}
	
});
var createCronJob = function(time) {
new CronJob(time, function() {
  			console.log('The CronJob is running');
  			var textTwiml = new twilio.TwimlResponse();
  			textTwiml.message("IT'S WORKING!");
  			request.send(textTwiml.toString());
  		}, null, true, 'America/New_York');
}



app.listen(3000);
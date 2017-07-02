'use strict';
var Alexa = require('alexa-sdk');
var APP_ID = "amzn1.ask.skill.4e920c3d-e7a8-420c-b081-adbe5001912a";  // I expect this to do the required security check in alexa.js, but found no way to test it
var facts = require('./facts');
var GET_FACT_MSG_EN = [
    "Here's your quote: ",
    "There you go: ",
    "Here you have your quote: ",
    "Do you know this one?: ",
    "Here it is: ",
    "A quote you might not know: ",
    "There it is: ",
    "Here you go: "
]
// Test hooks - do not remove!
exports.GetFactMsg = GET_FACT_MSG_EN;
var APP_ID_TEST = "mochatest";  // used for mocha tests to prevent warning
// end Test hooks
/*
    TODO (Part 2) add messages needed for the additional intent
    TODO (Part 3) add reprompt messages as needed
*/
var languageStrings = {
    "en": {
        "translation": {
            "FACTS": facts.FACTS_EN,
            "SKILL_NAME": "Epicurus the sage",  // OPTIONAL change this to a more descriptive name ==> changed it to my skill name
            "GET_FACT_MESSAGE": GET_FACT_MSG_EN,
            "GET_YEARFACT_HELP_MESSAGE": [        // help/remprompt message for GetNewYearFactIntent
              "Tell me a four-digit year and I will tell you a quote loosely related to it. What year do you fancy for your quote?",
              "Give me a year with for digits, and I will give you back a quote for that year.",
              "You can tell a four-digit year and I will give you a quote.",
              "If you tell a four-digit year I will answer with a quote for that year"
            ],
            "GET_YEARFACT_NO_YEAR_MESSAGE": [     // message when no quote found for the requested year
                                                  // (actually array of messages for allowing variation)
                "Haven't found any quote for year ",
                "Sorry I don't find anything for year ",
                "I regret that my database does not have an entry for year ",
                "Don't have info for year ",
                "No info for year "
            ],
            "GET_YEARFACT_NO_YEAR_MESSAGE_CONT": [  // continuation of message when no quote is found for the requested year
                                                    // (actually array of messages for allowing variation)
                ". Here's your quote for a random year: ",
                ". This is another quote that you might like: ",
                ". What about this one: ",
                ". Honestly this one is chosen at random: ",
                ". Here you have a quote anyway: "
            ],
            "HELP_MESSAGE": "You can say tell me a quote, or, you can say exit... What can I help you with?",
            "HELP_REPROMPT": "What can I help you with?",
            "STOP_MESSAGE": "Goodbye!"
        }
    }
};

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // set a test appId if running the mocha local tests
    if (event.session.application.applicationId == "mochatest") {
        alexa.appId = APP_ID_TEST
    }
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

/*
    TODO (Part 2) add an intent for specifying a fact by year named 'GetNewYearFactIntent'
    TODO (Part 2) provide a function for the new intent named 'GetYearFact'
        that emits a randomized fact that includes the year requested by the user
        - if such a fact is not available, tell the user this and provide an alternative fact.
    TODO (Part 3) Keep the session open by providing the fact with :askWithCard instead of :tellWithCard
        - make sure the user knows that they need to respond
        - provide a reprompt that lets the user know how they can respond
    TODO (Part 3) Provide a randomized response for the GET_FACT_MESSAGE
        - add message to the array GET_FACT_MSG_EN
        - randomize this starting portion of the response for conversational variety
*/

var handlers = {
    'LaunchRequest': function () {
        this.emit('GetFact');
    },
    'GetNewFactIntent': function () {
        this.emit('GetFact');
    },
    'GetFact': function () {
        // Get a random fact from the facts list
        // Use this.t() to get corresponding language data
        var factArr = this.t('FACTS');
        var randomFact = randomPhrase(factArr);

        // Create speech output
        var speechOutput = randomPhrase(this.t("GET_FACT_MESSAGE")) + randomFact;
        var rempromptSpeech = randomPhrase(this.t("GET_YEARFACT_HELP_MESSAGE"));
        this.emit(':askWithCard', speechOutput, rempromptSpeech, this.t("SKILL_NAME"), randomFact)
    },
    'GetNewYearFactIntent': function () {
      this.emit('GetYearFact', this.event.request.intent.slots.FACT_YEAR.value);
    },
    'GetYearFact': function (yearSlot) {
        // Get a random fact from the facts list
        // Use this.t() to get corresponding language data
        var factArr = this.t('FACTS');
        // find a quote for the year in the slot
        var yearQuote = yearPhrase(factArr, yearSlot);
        var speechHeader;
        if (yearQuote === null) {
            // no fact found for the year
            speechHeader = randomPhrase(this.t("GET_YEARFACT_NO_YEAR_MESSAGE")) +
              yearSlot + randomPhrase(this.t("GET_YEARFACT_NO_YEAR_MESSAGE_CONT"));
            // get a quote at random
            yearQuote = randomPhrase(factArr);
        } else {
            // header of the message when year is found
            speechHeader = randomPhrase(this.t("GET_FACT_MESSAGE"));
        }

        // complete speech output and emit
        var speechOutput = speechHeader + yearQuote;
        var rempromptSpeech = randomPhrase(this.t("GET_YEARFACT_HELP_MESSAGE"));
        this.emit(':askWithCard', speechOutput, rempromptSpeech, this.t("SKILL_NAME"), yearQuote);
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = this.t("HELP_MESSAGE");
        var reprompt = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    }
};

function yearPhrase(phraseArr, year) {
    // returns a phrase for a year
    // where phraseArr is an array of string phrases
    // where year is the year for which the phrase should be returned

    // construct array of candidate phrases which contain the year
    var candidateArr = [];
    for (var i = 0; i < phraseArr.length; i ++) {
        var candidate = phraseArr[i];
        if (candidate.indexOf(year.toString()) !== -1) {
          candidateArr.push(candidate);
        }
    }

    if (candidateArr.length == 0) {
        // no candidates found for the year
        return(null);
    }

    // return one of the candidates at random
    return randomPhrase(candidateArr);
}

function randomPhrase(phraseArr) {
    // returns a random phrase
    // where phraseArr is an array of string phrases
    var i = 0;
    i = Math.floor(Math.random() * phraseArr.length);
    return (phraseArr[i]);
};

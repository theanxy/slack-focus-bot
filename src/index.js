'use strict';

var _ = require('lodash');
var request = require('request');
var Botkit = require('botkit');
var Firebase = require('firebase');
var config = require('./config');

if (!config.slackToken|| !config.firebaseToken) {
    console.log('Error: Specify slack and firebase tokens first.');
    process.exit(1);
}

var emailsToIds = {};

var controller = Botkit.slackbot({
    debug: false
});

var bot = controller.spawn({
    token: config.slackToken
});

var ref = new Firebase(config.firebaseUrl);

ref.authWithCustomToken(config.firebaseToken, (error) => {
    if (error) {
        console.log('Authentication Failed!', error);
    } else {
        console.log('Authenticated successfully');
    }
});

// Setup
ref.child('users').once('value', (snapshot) => {
    // @todo can we use es6 desctructuring?
    emailsToIds = _.reduce(snapshot.val(), (result, value) => {
        result[value.google.email] = value;
        return result;
    }, {});
});

bot.startRTM(err => {
    if (err) {
        throw new Error('Could not connect to Slack');
    }
});

// Bot commands
controller.hears(['show (.*)'],'direct_message,direct_mention,mention', handleCards);

function handleCards(bot, message) {
    bot.startConversation(message, (err, convo) => {
        if (!Object.keys(emailsToIds).length) {
            bot.reply(message, 'Bot is still initialising, please try again in a while.');
            convo.stop();
        }

        let matches = message.text.match(/<mailto:(.*)\|/i);
        let email = matches && matches[1];
        let user = emailsToIds[email];

        if (!email || !user) {
            convo.say('I couldn\'t find any users with email ' + email + ' :confused:');
            convo.next();
        } else {
            renderListOfCards(convo, user, email);
        }
    });
}

function renderListOfCards(convo, user, email) {
    let res = {
        text: 'Showing cards owned by ' + email + ':',
        attachments: []
    };

    let attachment = {
        text: '',
        author_name: user.google.displayName,
        author_link: config.unleashUrl + '/' + user.username,
        author_icon: user.google.cachedUserProfile.picture,
        thumb_url: user.google.cachedUserProfile.picture
    };

    ref.child('users/' + user.uid + '/cards').limitToLast(9).once('value', snapshot => {
        let val = snapshot.val();
        let cards = [];

        _.map(val, card => {
            let index = cards.push(card);
            attachment.text += '\n:' + digitToWord(index) + ': ' + card.type;
        });

        res.attachments.push(attachment);

        convo.say(res);
        //convo.next();

        convo.ask('Select a number to view more details, or reply DONE otherwise.', [
            {
                pattern: 'done',
                callback: function(response, convo) {
                    convo.say('Alright! Have a nice day!!');

                    convo.next();
                    //convo.stop();
                }
            },
            {
                default: true,
                callback: function(response, convo) {
                    const choice = parseInt(response.text, 10);

                    if (_.isNumber(choice) && _.inRange(choice, 1, cards.length + 1)) {
                        var currentCard = cards[choice-1];

                        convo.say(renderSingleCard(choice, currentCard, user));
                    }

                    convo.repeat();
                    convo.next();
                }
            }

        ]);
    })
}

function renderSingleCard(choice, currentCard, user) {
    return {
        text: 'You picked card ' + choice + ':',
        attachments: [
            {
                title: currentCard.type + (currentCard.achieved ? ' (achieved!)' : ''),
                title_link: config.unleashUrl + '/paths/' + user.username,
                color: currentCard.achieved ? 'good' : '',
                fields: [
                    {
                        title: 'Description',
                        value: currentCard.task
                    },
                    {
                        title: 'Level',
                        value: currentCard.level || 'none',
                        short: true
                    },
                    {
                        title: 'Due date',
                        value: currentCard.dueDate || 'none',
                        short: true
                    }
                ],
                thumb_url: 'http://ptu.dobranowski.pl/logo.png'
            }
        ]
    }
}

function digitToWord(digit) {
    if (!_.inRange(digit, 0, 10)) {
        return;
    }

    const words = [
        'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'
    ];

    return words[digit];
}

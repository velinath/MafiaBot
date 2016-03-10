"use strict";

var config = require('./config.js');
var _ = require('lodash');
var store = require('node-persist');
var Discord = require('discord.js');

// init stuff
store.initSync();
var defaults = {
    channelsActivated: [],
};
_.each(defaults, (val, key) => {
    var objWithDefaults = _.merge({}, {[key]: val}, {[key]: store.getItem(key)});
    store.setItem(key, objWithDefaults[key]);
});
var mafiabot = new Discord.Client();

// utilities
var adminCheck = message => {
    if (config.admins.indexOf(message.author.id) >= 0) {
        return true;
    }
    mafiabot.reply(message, `You must be an admin to perform command *${message.content}*!`);
    return false;
};
var activatedCheck = message => {
    return store.getItem('channelsActivated').indexOf(message.channel.id) >= 0;
}

// set up discord events
mafiabot.on("message", message => {
    var contentLower = message.content.toLowerCase();
    if (contentLower.indexOf('##activatemafia') == 0) {
        // activate MafiaBot on the given channel - ADMIN ONLY
        if (adminCheck(message)) {
            var currentChannels = store.getItem('channelsActivated');
            if (currentChannels.indexOf(message.channel.id) >= 0) {
                mafiabot.reply(message, `MafiaBot is already activated on channel **#${message.channel.name}**! Use *##deactivatemafia* to deactivate MafiaBot on this channel.`);
            } else {
                currentChannels.push(message.channel.id);
                store.setItem('channelsActivated', currentChannels);
                mafiabot.reply(message, `MafiaBot has been activated on channel **#${message.channel.name}**! Use *##startgame* to start playing some mafia!`);
            }
        }
    } else if (contentLower.indexOf('##deactivatemafia') == 0) {
        // deactivate MafiaBot on the given channel - ADMIN ONLY
        if (adminCheck(message)) {
            var currentChannels = store.getItem('channelsActivated');
            if (currentChannels.indexOf(message.channel.id) >= 0) {
                currentChannels.splice(currentChannels.indexOf(message.channel.id), 1);
                store.setItem('channelsActivated', currentChannels);
                mafiabot.reply(message, `MafiaBot has been deactivated on channel **#${message.channel.name}**!`);
            } else {
                mafiabot.reply(message, `MafiaBot is not activate on channel **#${message.channel.name}**! Use *##activatemafia* to activate MafiaBot on this channel.`);
            }
        }
    } else if (contentLower.indexOf('##startgame') == 0) {
        // start a game and wait for players to join
        if (activatedCheck(message)) {
            mafiabot.reply(message, "Starting game of mafia!");            
        }
    }
});

// login and export after everything is set up
mafiabot.login(config.email, config.password);
module.exports = mafiabot;
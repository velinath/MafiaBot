"use strict";

var Discord = require('discord.js');
var config = require('./config.js');

var mafiabot = new Discord.Client();

mafiabot.on("message", message => {
    if(message.content === "##startmafia")
        mafiabot.reply(message, "Starting game of mafia!");
});

// login and export after everything is set up
mafiabot.login(config.email, config.password);
module.exports = mafiabot;
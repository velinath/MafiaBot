# MafiaBot

A Discord bot for coordinating a game of mafia without the need for a host!  

Join our public Mafia server if you want to try out the bot: http://discord.me/mafia  

## Features
* Fully scriptable linear-flow [role system](mafia.js#L1401-L1429) with [mixins](roles/mods) for super flexible yet simple role definitions.
* Add your own role setups using any combination of roles and mixins for any number of players.
* Configurable role setup [variations](roles/variations/index.js) which randomly change setups to get more fun and surprise out of your setups.
* Custom data store system that is IMPERVIOUS to corruption and crashes. Silently [recovers from any error](mafiabot_autorun_and_update.bat) and continues running seamlessly.
* Total control of user speech and group chat permissions to fully enforce no-talking-at-night and secret mafia chat rules.
* Keeps track of many in-game statistics such as a history of all votes made by every player.

## Install

Download [node.js](https://nodejs.org) version **v7.0.0 or higher**, then go to MafiaBot folder and:  
```sh
$ npm install
```

## Config

Setup all the admin user ID values in `config.js`  
Setup the bot's user token in `creds.js` (follow the [Discord developer guide](https://discordapp.com/developers/docs/intro) to get the token)  

## Run

```sh
$ npm start
```
or
```sh
$ node --harmony_rest_parameters mafia-release.js
```
The app uses the Rest Parameters feature so make sure that flag is set. The app will crash immediately if it's not set, so it should be easy to catch.  

On a Windows server, you can use the autorun batch file to make sure the bot seamlessly recovers from errors.  
```sh
$ mafiabot_autorun_and_update.bat
```

## Debug

Install [Node Inspector](https://github.com/node-inspector/node-inspector), then

```sh
$ node-debug --nodejs --harmony_rest_parameters mafia-debug.js
```

## Credits
Tombolo: *Role setup contributions*  
foolmoron: *Everything else*  

## Shout Out
To Quick-Man for being the winner of the first ever real game of mafia coordinated by MafiaBot!
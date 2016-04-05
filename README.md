# MafiaBot

A Discord bot for playing mafia

## Install

```sh
$ npm install
```

## Config

Setup all the required values in `config.js`

## Run

```sh
$ node --harmony_rest_parameters mafia.js
```
The app uses the Rest Parameters feature so make sure that flag is set. The app will crash immediately if it's not set, so it should be easy to catch.

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
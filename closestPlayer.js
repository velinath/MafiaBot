var _ = require('lodash');
var levenshtein = (function() { // wrap levenshtein function to get 0.0 - 1.0 similarity range
    var fl = require('fast-levenshtein'); 
    return function(a, b) { 
        return 1 - fl.get(a, b)/Math.max(a.length, b.length); 
    }; 
})();
var jarowinkler = require('jaro-winkler');

module.exports = (str, players) => {
    str = (str || '').toLowerCase();
    if (str.indexOf('@') >= 0) {
        // direct mention, easy to find player
        return _.find(players, {id: str.replace(/[\<\@\>]/g, '')});
    } else {
        // indirect mention, need to use string distance algorithm to find player
        const levLimit = 0.5;
        const jwLimit = 0.7;
        var playerNameComparisons = _.sortBy(_.map(players, function(player) {
            return {
                id: player.id,
                name: player.name,
                lev: levenshtein(str, player.name.toLowerCase()),
                jw: jarowinkler(str, player.name.toLowerCase()),
            }
        }), function(item) {
            var score = 0;
            if (item.lev >= levLimit) score += 1000;
            if (item.jw >= jwLimit) score += 1000;
            score += item.lev;
            score += item.jw;
            return -score;
        });
        var closestMatch = playerNameComparisons[0];
        if (closestMatch.lev >= levLimit || closestMatch.jw >= jwLimit) {
            return _.find(players, {id: closestMatch.id});
        } else {
            return null; // closest match is not good enough
        }
    }
}